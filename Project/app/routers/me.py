# app/routers/me.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from ..db import get_db
from ..auth import current_user

router=APIRouter(prefix="/me",tags=["me"])

@router.get("")
async def get_me(db:AsyncSession=Depends(get_db),user=Depends(current_user)):
    q=text("select id,email,name,role from users where id=:uid")
    res=await db.execute(q,{"uid":user["id"]})
    row=res.mappings().first()
    if not row:
        # should be rare if ensure_app_user is working
        raise HTTPException(status_code=404,detail="user not found")
    return dict(row)

# optional: let user update name
@router.patch("")
async def update_me(payload:dict,db:AsyncSession=Depends(get_db),user=Depends(current_user)):
    name=payload.get("name")
    if not name:
        raise HTTPException(status_code=400,detail="name required")
    q=text("update users set name=:name where id=:uid returning id,email,name,role")
    res=await db.execute(q,{"name":name,"uid":user["id"]})
    row=res.mappings().first()
    await db.commit()
    return dict(row)
