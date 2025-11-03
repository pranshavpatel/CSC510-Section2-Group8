# app/routers/addresses.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from ..db import get_db
from ..auth import current_user

router = APIRouter(prefix="/addresses", tags=["addresses"])

class AddressCreate(BaseModel):
    label: Optional[str] = None
    line1: str
    line2: Optional[str] = None
    city: str
    state: str
    zip: str
    is_default: bool = False

class AddressUpdate(BaseModel):
    label: Optional[str] = None
    line1: Optional[str] = None
    line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip: Optional[str] = None
    is_default: Optional[bool] = None

@router.get("")
async def list_addresses(db: AsyncSession = Depends(get_db), user=Depends(current_user)):
    q = text("select * from addresses where user_id=:uid order by created_at desc")
    rows = (await db.execute(q, {"uid": user["id"]})).mappings().all()
    return [dict(r) for r in rows]

@router.post("")
async def create_address(body: AddressCreate, db: AsyncSession = Depends(get_db), user=Depends(current_user)):
    if body.is_default:
        await db.execute(text("update addresses set is_default=false where user_id=:uid"), {"uid": user["id"]})

    ins = text("""
      insert into addresses (user_id,label,line1,line2,city,state,zip,is_default)
      values (:uid,:label,:line1,:line2,:city,:state,:zip,:is_default)
      returning *
    """)
    res = await db.execute(ins, {"uid": user["id"], **body.model_dump()})
    row = res.mappings().first()
    await db.commit()
    return dict(row)

@router.patch("/{addr_id}")
async def update_address(addr_id: str, body: AddressUpdate, db: AsyncSession = Depends(get_db), user=Depends(current_user)):
    # ownership check
    own = await db.execute(text("select 1 from addresses where id=:id and user_id=:uid"), {"id": addr_id, "uid": user["id"]})
    if not own.first():
        raise HTTPException(status_code=404, detail="address not found")

    if body.is_default is True:
        await db.execute(text("update addresses set is_default=false where user_id=:uid and id <> :id"), {"uid": user["id"], "id": addr_id})

    upd = text("""
      update addresses
      set
        label = COALESCE(:label, label),
        line1 = COALESCE(:line1, line1),
        line2 = COALESCE(:line2, line2),
        city  = COALESCE(:city, city),
        state = COALESCE(:state, state),
        zip   = COALESCE(:zip, zip),
        is_default = COALESCE(:is_default, is_default)
      where id=:id and user_id=:uid
      returning *
    """)
    res = await db.execute(upd, {"id": addr_id, "uid": user["id"], **body.model_dump()})
    row = res.mappings().first()
    await db.commit()
    if not row:
        raise HTTPException(status_code=404, detail="address not found")
    return dict(row)

@router.delete("/{addr_id}")
async def delete_address(addr_id: str, db: AsyncSession = Depends(get_db), user=Depends(current_user)):
    delq = text("delete from addresses where id=:id and user_id=:uid returning id")
    res = await db.execute(delq, {"id": addr_id, "uid": user["id"]})
    row = res.first()
    await db.commit()
    if not row:
        raise HTTPException(status_code=404, detail="address not found")
    return {"deleted": addr_id}
