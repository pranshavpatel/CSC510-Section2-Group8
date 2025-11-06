# app/routers/auth_routes.py
import httpx
from fastapi import APIRouter, HTTPException, status, Depends, Header
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Optional

from ..config import settings
from ..db import get_db
from ..auth import current_user  # validate JWT & provide user dict


router = APIRouter(prefix="/auth", tags=["auth"])


# =========================
# Schemas
# =========================
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str


class OwnerSignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    restaurant_name: str
    restaurant_address: str
    latitude: float
    longitude: float


class RefreshRequest(BaseModel):
    refresh_token: str


# =========================
# Helpers
# =========================
async def ensure_app_user(
    db: AsyncSession,
    *,
    user_id: str,
    email: str,
    name: Optional[str] = None,
) -> None:
    """Make sure a Supabase user exists in local app DB and keep minimal fields in sync."""
    # 1) try by id
    q_by_id = text("select id from users where id=:uid")
    row = (await db.execute(q_by_id, {"uid": user_id})).mappings().first()
    if row:
        upd = text(
            """
            update users
            set email=:email,
                name = coalesce(:name, name)
            where id=:uid
            """
        )
        await db.execute(upd, {"uid": user_id, "email": email, "name": name})
        return

    # 2) try by email (older records before Supabase sync)
    q_by_email = text("select id from users where email=:email")
    row2 = (await db.execute(q_by_email, {"email": email})).mappings().first()
    if row2:
        # User exists by email - just update name and email, DO NOT update ID
        # (ID is immutable and may be referenced by foreign keys)
        upd = text(
            """
            update users
            set name = coalesce(:name, name),
                email = :email
            where email=:email
            """
        )
        await db.execute(upd, {"email": email, "name": name})
        return

    # 3) neither exists → insert
    ins = text(
        """
        insert into users (id, email, name, role)
        values (:uid, :email, :name, 'customer')
        """
    )
    await db.execute(ins, {"uid": user_id, "email": email, "name": name})


def _extract_bearer_token(authorization: Optional[str]) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="missing bearer token")
    return authorization.split(" ", 1)[1].strip()


# =========================
# Auth endpoints
# =========================
@router.post("/signup")
async def signup(payload: SignupRequest, db: AsyncSession = Depends(get_db)):
    # Step 1 – sign up via Supabase Auth
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.post(
            f"{settings.SUPABASE_URL}/auth/v1/signup",
            headers={
                "apikey": settings.SUPABASE_ANON_KEY or "",
                "Content-Type": "application/json",
            },
            json={"email": payload.email, "password": payload.password, "data": {"name": payload.name}},
        )
    if r.status_code >= 400:
        # Pass through Supabase error to caller
        try:
            err = r.json()
        except Exception:
            err = {"message": r.text}
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err)

    data = r.json()
    # Sign-up response may return either {user: {...}} or flat fields depending on GoTrue version
    user_id = data.get("id") or (data.get("user") or {}).get("id")
    user_email = data.get("email") or (data.get("user") or {}).get("email")

    if not user_id or not user_email:
        raise HTTPException(status_code=500, detail="unexpected signup response from auth provider")

    # Step 2 – mirror into your app DB with the user’s name
    ins = text(
        """
        insert into users (id, email, name, role)
        values (:uid, :email, :name, 'customer')
        on conflict (id) do update
        set name = excluded.name, email = excluded.email
        """
    )
    await db.execute(ins, {"uid": user_id, "email": user_email, "name": payload.name})
    await db.commit()

    return {"id": user_id, "email": user_email, "name": payload.name}


@router.post("/owner/signup")
async def owner_signup(payload: OwnerSignupRequest, db: AsyncSession = Depends(get_db)):
    """
    Sign up a new restaurant owner.
    Creates:
    1. User account via Supabase Auth
    2. User record in local DB with role='owner'
    3. Restaurant record linked to the owner
    4. Restaurant staff entry linking owner to restaurant
    """
    # Step 1: Sign up via Supabase Auth
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.post(
            f"{settings.SUPABASE_URL}/auth/v1/signup",
            headers={
                "apikey": settings.SUPABASE_ANON_KEY or "",
                "Content-Type": "application/json",
            },
            json={"email": payload.email, "password": payload.password, "data": {"name": payload.name}},
        )
    if r.status_code >= 400:
        # Pass through Supabase error to caller
        try:
            err = r.json()
        except Exception:
            err = {"message": r.text}
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err)

    data = r.json()
    # Sign-up response may return either {user: {...}} or flat fields depending on GoTrue version
    user_id = data.get("id") or (data.get("user") or {}).get("id")
    user_email = data.get("email") or (data.get("user") or {}).get("email")

    if not user_id or not user_email:
        raise HTTPException(status_code=500, detail="unexpected signup response from auth provider")

    # Step 2: Create user, restaurant, and restaurant_staff in a transaction
    try:
        # Insert user with role='owner'
        ins_user = text(
            """
            insert into users (id, email, name, role)
            values (:uid, :email, :name, 'owner')
            on conflict (id) do update
            set name = excluded.name, email = excluded.email, role = 'owner'
            """
        )
        await db.execute(ins_user, {"uid": user_id, "email": user_email, "name": payload.name})
        
        # Insert restaurant
        ins_restaurant = text(
            """
            insert into restaurants (name, address, owner_id, latitudes, longitudes)
            values (:name, :address, :owner_id, :lat, :lng)
            returning id
            """
        )
        result = await db.execute(
            ins_restaurant,
            {
                "name": payload.restaurant_name,
                "address": payload.restaurant_address,
                "owner_id": user_id,
                "lat": payload.latitude,
                "lng": payload.longitude,
            }
        )
        restaurant_row = result.first()
        if not restaurant_row:
            raise HTTPException(status_code=500, detail="failed to create restaurant record")
        restaurant_id = restaurant_row[0]
        
        # Insert restaurant_staff entry
        ins_staff = text(
            """
            insert into restaurant_staff (restaurant_id, user_id, role)
            values (:restaurant_id, :user_id, 'owner')
            """
        )
        await db.execute(ins_staff, {"restaurant_id": restaurant_id, "user_id": user_id})
        
        await db.commit()
        
        return {
            "id": user_id,
            "email": user_email,
            "name": payload.name,
            "restaurant_id": str(restaurant_id),
            "restaurant_name": payload.restaurant_name
        }
    except Exception as e:
        await db.rollback()
        # If database transaction fails, we should ideally delete the Supabase user
        # but for now, we'll just report the error
        raise HTTPException(status_code=500, detail=f"Failed to create owner account: {str(e)}")


@router.post("/login")
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    email = payload.email
    password = payload.password
    if not email or not password:
        raise HTTPException(status_code=400, detail="email and password required")

    # 1) password grant → get tokens
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.post(
            f"{settings.SUPABASE_URL}/auth/v1/token?grant_type=password",
            headers={
                "apikey": settings.SUPABASE_ANON_KEY or "",
                "Content-Type": "application/json",
            },
            json={"email": email, "password": password},
        )
    if r.status_code >= 400:
        raise HTTPException(status_code=400, detail="invalid credentials")

    token_data = r.json()  # access_token, refresh_token, token_type, user (maybe)
    access_token = token_data.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="invalid credentials")

    # 2) fetch user (confirm id/email)
    async with httpx.AsyncClient(timeout=10.0) as client:
        me = await client.get(
            f"{settings.SUPABASE_URL}/auth/v1/user",
            headers={
                "apikey": settings.SUPABASE_ANON_KEY or "",
                "Authorization": f"Bearer {access_token}",
            },
        )
    if me.status_code >= 400:
        raise HTTPException(status_code=400, detail="could not fetch user from supabase")

    me_data = me.json()
    user_id = me_data.get("id")
    user_email = me_data.get("email")
    user_name = (me_data.get("user_metadata") or {}).get("name")

    if not user_id or not user_email:
        raise HTTPException(status_code=400, detail="invalid user data from auth provider")

    # 3) ensure local user row
    await ensure_app_user(db, user_id=user_id, email=user_email, name=user_name)
    await db.commit()

    # 4) response for frontend
    return {
        "access_token": access_token,
        "token_type": token_data.get("token_type", "bearer"),
        "refresh_token": token_data.get("refresh_token"),
        "user": {"id": user_id, "email": user_email, "name": user_name},
    }


@router.post("/refresh")
async def refresh_token(body: RefreshRequest):
    """Exchange refresh_token → new access_token using Supabase GoTrue."""
    supabase_refresh_url = f"{settings.SUPABASE_URL}/auth/v1/token?grant_type=refresh_token"
    headers = {
        "apikey": settings.SUPABASE_ANON_KEY or "",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.post(supabase_refresh_url, headers=headers, json={"refresh_token": body.refresh_token})

    if r.status_code != 200:
        # surface upstream error
        try:
            err = r.json()
        except Exception:
            err = {"message": r.text}
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=err.get("message", "refresh failed"),
        )

    return r.json()


@router.post("/logout")
async def logout(authorization: Optional[str] = Header(None)):
    """
    Invalidate the current session with Supabase. We don't need DB here.
    Requires the Authorization: Bearer <access_token> header.
    """
    access_token = _extract_bearer_token(authorization)

    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.post(
            f"{settings.SUPABASE_URL}/auth/v1/logout",
            headers={
                "apikey": settings.SUPABASE_ANON_KEY or "",
                "Authorization": f"Bearer {access_token}",
            },
        )

    # GoTrue often returns 200 or 204; treat 401 as already invalidated
    if r.status_code in (200, 204, 401):
        return {"ok": True}
    try:
        err = r.json()
    except Exception:
        err = {"message": r.text}
    raise HTTPException(status_code=r.status_code, detail=err)


@router.delete("/me")
async def delete_me(
    db: AsyncSession = Depends(get_db),
    user=Depends(current_user),  # validated, gives {"id": "...", "email": ...}
):
    """
    Permanently delete the current user:
      1) Delete local rows (users) – rely on ON DELETE CASCADE for related tables if set.
      2) Delete Supabase user via Admin API (requires service role key).
    """
    uid = str(user["id"]).strip()

    # 1) delete local user (best-effort)
    try:
        await db.execute(text("delete from users where id = :uid"), {"uid": uid})
        await db.commit()
    except Exception:
        # don't block admin delete if local delete fails
        await db.rollback()

    # 2) Supabase admin delete (requires service role)
    if not settings.SUPABASE_SERVICE_ROLE_KEY:
        # If no service key, we can't remove the auth identity; inform caller.
        return {
            "deleted_in_app_db": True,
            "deleted_in_supabase": False,
            "note": "Missing SUPABASE_SERVICE_ROLE_KEY; only local data was removed.",
        }

    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.delete(
            f"{settings.SUPABASE_URL}/auth/v1/admin/users/{uid}",
            headers={
                "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
                "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
            },
        )

    if r.status_code in (200, 204):
        return {"deleted_in_app_db": True, "deleted_in_supabase": True}

    # If Supabase deletion failed, surface error but keep local deletion result.
    try:
        err = r.json()
    except Exception:
        err = {"message": r.text}
    raise HTTPException(status_code=r.status_code, detail=err)
