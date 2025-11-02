# app/routers/me.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from pydantic import BaseModel
from ..db import get_db
from ..auth import current_user  # the one that decodes token

router=APIRouter(prefix="/me", tags=["me"])

class MeUpdate(BaseModel):
    name:str|None=None
    phone:str|None=None

@router.get("/me")
async def get_me(
    db:AsyncSession=Depends(get_db),
    user=Depends(current_user),
):
    q=text("""
        select id, email, name, role
        from users
        where id = :uid
    """)
    res=await db.execute(q, {"uid": user["id"]})
    row=res.mappings().first()
    # fall back to auth data if row is missing
    return row or {
        "id": user["id"],
        "email": user["email"],
        "name": user.get("name"),
        "role": "customer",
    }

@router.put("")
async def update_me(
    body:MeUpdate,
    db:AsyncSession=Depends(get_db),
    user=Depends(current_user),
):
    upd=text("""
        update users
        set
          name = coalesce(:name, name),
          phone = coalesce(:phone, phone)
        where id=:uid
        returning id, email, name, role, phone
    """)
    res=await db.execute(
        upd,
        {
            "uid":user["id"],
            "name":body.name,
            "phone":body.phone,
        },
    )
    row=res.mappings().first()
    await db.commit()
    return dict(row)
