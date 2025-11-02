# app/routers/catalog.py
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from ..db import get_db

router = APIRouter()

@router.get("/restaurants")
async def list_restaurants(
    db: AsyncSession = Depends(get_db),
    limit: int = Query(default=50, le=100),
):
    q = text("""
        select id, name, address, latitudes, longitudes
        from restaurants
        order by created_at desc
        limit :limit
    """)
    rows = (await db.execute(q, {"limit": limit})).mappings().all()
    return [dict(r) for r in rows]

@router.get("/meals")
async def list_meals(
    db: AsyncSession = Depends(get_db),
    surplus_only: bool = Query(default=True),
    restaurant_id: str or None = None,
    limit: int = Query(default=50, le=100),
):
    base = """
        select id, restaurant_id, name, tags, base_price, surplus_qty, surplus_price, allergens, calories
        from meals
        {where}
        order by created_at desc
        limit :limit
    """
    conds = []
    params: dict = {"limit": limit}
    if surplus_only:
        conds.append("surplus_qty > 0")
    if restaurant_id:
        conds.append("restaurant_id = :rid")
        params["rid"] = restaurant_id
    where = ""
    if conds:
        where = "where " + " and ".join(conds)
    q = text(base.format(where=where))
    rows = (await db.execute(q, params)).mappings().all()
    return [dict(r) for r in rows]
