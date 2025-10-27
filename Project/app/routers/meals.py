from fastapi import APIRouter, Depends, Query
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
    q = """
      select id, restaurant_id, name, tags, base_price, surplus_qty, surplus_price, allergens, calories
      from meals
      {where_clause}
      order by created_at desc
      limit :limit
    """
    where = "where surplus_qty > 0" if surplus_only else ""
    rows = (await db.execute(text(q.format(where_clause=where)), {"limit": limit})).mappings().all()
    return [dict(r) for r in rows]
