# app/routers/debug_auth.py
from fastapi import APIRouter, Depends
from ..auth import current_user

router = APIRouter()

@router.get("/me")
async def whoami(user=Depends(current_user)):
    return user
