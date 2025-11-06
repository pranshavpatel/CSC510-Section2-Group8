from fastapi import Depends, HTTPException
from ..auth import current_user
from database.database import database

async def require_owner(user: dict = Depends(current_user)):
    q = "SELECT role FROM users WHERE id = :user_id"
    row = await database.fetch_one(q, {"user_id": user["id"]})

    row = dict(row) if row else None

    if not row or row["role"] != "owner":
        raise HTTPException(status_code=403, detail="Owner role required")
    return user
