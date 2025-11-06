# app/routers/catalog.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Optional
from ..db import get_db

router = APIRouter()

@router.get("/restaurants")
async def list_restaurants(
    db: AsyncSession = Depends(get_db),
    search: Optional[str] = Query(default=None, description="Search substring for restaurant name"),
    limit: int = Query(default=20, le=100),
    offset: int = Query(default=0, ge=0),
    sort: str = Query(default="name_asc", description="one of: name_asc,name_desc"),
):
    """
    Browse restaurants with:
    - search (case-insensitive match on name)
    - pagination (limit, offset)
    - sort (by name asc/desc)
    """

    sort_map = {
        "name_asc": "name asc",
        "name_desc": "name desc",
    }
    orderby = sort_map.get(sort, "name asc")

    where_clause = ""
    params = {
        "limit": limit,
        "offset": offset,
    }

    if search:
        where_clause = "where lower(name) like :q"
        params["q"] = f"%{search.lower()}%"

    q = text(f"""
        select
            id,
            name,
            address,
            latitude,
            longitude
        from restaurants
        {where_clause}
        order by {orderby}
        limit :limit
        offset :offset
    """)

    rows = (await db.execute(q, params)).mappings().all()
    return [dict(r) for r in rows]


@router.get("/restaurants/{restaurant_id}/meals")
async def list_meals_for_restaurant(
    restaurant_id: str,
    db: AsyncSession = Depends(get_db),
    surplus_only: bool = Query(default=False, description="Only show meals with surplus available"),
    search: Optional[str] = Query(default=None, description="Search substring for meal name"),
    limit: int = Query(default=20, le=100),
    offset: int = Query(default=0, ge=0),
    sort: str = Query(
        default="name_asc",
        description="one of: name_asc,name_desc,price_asc,price_desc"
    ),
):
    """
    Browse meals from one restaurant with:
    - surplus_only (filter meals with quantity > 0)
    - search (on meal name)
    - pagination (limit, offset)
    - sort (name or surplus_price)
    """

    sort_map = {
        "name_asc": "m.name asc",
        "name_desc": "m.name desc",
        "price_asc": "m.surplus_price asc nulls last",
        "price_desc": "m.surplus_price desc nulls last",
    }
    orderby = sort_map.get(sort, "m.name asc")

    conds = ["m.restaurant_id = :rid"]
    params = {
        "rid": restaurant_id,
        "limit": limit,
        "offset": offset,
    }

    if surplus_only:
        conds.append("m.quantity > 0")

    if search:
        conds.append("lower(m.name) like :q")
        params["q"] = f"%{search.lower()}%"

    where_clause = " where " + " and ".join(conds)

    q = text(f"""
        select
            m.id,
            m.restaurant_id,
            m.name,
            m.tags,
            m.base_price,
            m.quantity,
            m.surplus_price,
            m.allergens,
            m.calories
        from meals m
        {where_clause}
        order by {orderby}
        limit :limit
        offset :offset
    """)

    rows = (await db.execute(q, params)).mappings().all()
    return [dict(r) for r in rows]
