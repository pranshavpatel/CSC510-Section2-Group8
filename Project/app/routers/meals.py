# app/routers/meals.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from ..db import get_db

router = APIRouter()

@router.get("")
async def list_meals(
    surplus_only: bool = Query(default=True),
    limit: int = Query(default=50, le=100),
    db: AsyncSession = Depends(get_db),
):
    try:
        q = """
          select id, restaurant_id, name, tags, base_price, quantity, surplus_price, allergens, calories, image_link
          from meals
          {where_clause}
          order by created_at desc
          limit :limit
        """
        where = "where quantity > 0" if surplus_only else ""
        result = await db.execute(text(q.format(where_clause=where)), {"limit": limit})
        rows = result.mappings().all()
        return [dict(r) for r in rows]
    except Exception as e:
        # dev-friendly
        raise HTTPException(status_code=500, detail=f"DB error: {e}")
