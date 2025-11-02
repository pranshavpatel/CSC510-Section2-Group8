# app/routers/auth_routes.py
import httpx
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from ..config import settings
from ..db import get_db
from ..auth import ensure_app_user

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str


@router.post("/login")
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    email=payload.email
    password=payload.password
    if not email or not password:
        raise HTTPException(status_code=400, detail="email and password required")

    # 1) get access token from supabase
    async with httpx.AsyncClient() as client:
        r=await client.post(
            f"{settings.SUPABASE_URL}/auth/v1/token?grant_type=password",
            headers={
                "apikey":settings.SUPABASE_ANON_KEY,
                "Content-Type":"application/json",
            },
            json={"email":email,"password":password},
        )
    if r.status_code>=400:
        raise HTTPException(status_code=400, detail="invalid credentials")

    token_data=r.json()           # has access_token, refresh_token, user?
    access_token=token_data["access_token"]

    # 2) fetch user info from supabase using that token
    async with httpx.AsyncClient() as client:
        me=await client.get(
            f"{settings.SUPABASE_URL}/auth/v1/user",
            headers={
                "apikey":settings.SUPABASE_ANON_KEY,
                "Authorization":f"Bearer {access_token}",
            },
        )
    if me.status_code>=400:
        raise HTTPException(status_code=400, detail="could not fetch user from supabase")

    me_data=me.json()
    user_id=me_data["id"]
    user_email=me_data["email"]
    user_name=me_data.get("user_metadata",{}).get("name")  # may be None

    # 3) make sure the user exists in our app db
    await ensure_app_user(
        db,
        user_id=user_id,
        email=user_email,
        name=user_name,
    )
    await db.commit()

    # 4) return exactly what frontend expects
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_token": token_data.get("refresh_token"),
        "user": {
            "id": user_id,
            "email": user_email,
            "name": user_name,
        },
    }


@router.post("/signup")
async def signup(payload: SignupRequest, db: AsyncSession = Depends(get_db)):
    # Step 1 – sign up via Supabase Auth
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{settings.SUPABASE_URL}/auth/v1/signup",
            headers={
                "apikey": settings.SUPABASE_ANON_KEY,
                "Content-Type": "application/json",
            },
            json={"email": payload.email, "password": payload.password, "data": {"name": payload.name}},
        )
    if r.status_code >= 400:
        raise HTTPException(status_code=400, detail=r.json())
    data = r.json()

    user_id = data["id"]
    user_email = data["email"]

    # Step 2 – mirror into your app DB with the user’s name
    ins = text("""
        insert into users (id, email, name, role)
        values (:uid, :email, :name, 'customer')
        on conflict (id) do update
        set name = excluded.name, email = excluded.email;
    """)
    await db.execute(ins, {"uid": user_id, "email": user_email, "name": payload.name})
    await db.commit()

    return {"id": user_id, "email": user_email, "name": payload.name}




class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/refresh")
async def refresh_token(body: RefreshRequest):
    """
    Exchange refresh_token -> new access_token
    """
    supabase_refresh_url = f"{settings.SUPABASE_URL}/auth/v1/token?grant_type=refresh_token"

    headers = {
        "apikey": settings.SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.post(
            supabase_refresh_url,
            headers=headers,
            json={"refresh_token": body.refresh_token},
        )

    if r.status_code != 200:
        try:
            err = r.json()
        except Exception:
            err = {"message": r.text}
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=err.get("message", "refresh failed"),
        )

    return r.json()

