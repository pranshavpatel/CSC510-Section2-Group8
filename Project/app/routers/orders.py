# app/routers/orders.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import List
from ..db import get_db
from ..auth import current_user

router = APIRouter()

@router.post("")
async def create_order(
    payload: dict,
    db: AsyncSession = Depends(get_db),
    user=Depends(current_user),
):
    restaurant_id = payload.get("restaurant_id")
    items: List[dict] = payload.get("items") or []
    if not restaurant_id or not items:
        raise HTTPException(status_code=400, detail="restaurant_id and items required")

    create_order_q = text("""
        insert into orders (user_id, restaurant_id, status, total)
        values (:user_id, :restaurant_id, 'pending', 0)
        returning id
    """)
    res = await db.execute(create_order_q, {
        "user_id": str(user["id"]).strip(),
        "restaurant_id": restaurant_id,
    })
    order_id = res.mappings().first()["id"]

    total = 0.0

    for it in items:
        meal_id = it.get("meal_id")
        qty = int(it.get("qty", 0))
        if not meal_id or qty <= 0:
            raise HTTPException(status_code=400, detail="each item needs meal_id and positive qty")

        meal_q = text("""
            select id, surplus_qty, surplus_price, base_price
            from meals
            where id = :mid
            for update
        """)
        meal_res = await db.execute(meal_q, {"mid": meal_id})
        meal = meal_res.mappings().first()
        if not meal:
            raise HTTPException(status_code=404, detail=f"meal {meal_id} not found")
        if meal["surplus_qty"] < qty:
            raise HTTPException(status_code=400, detail=f"not enough surplus for meal {meal_id}")

        line_price = float(meal["surplus_price"]) * qty
        total += line_price

        insert_item_q = text("""
            insert into order_items (order_id, meal_id, qty, price)
            values (:order_id, :meal_id, :qty, :price)
        """)
        await db.execute(insert_item_q, {
            "order_id": order_id,
            "meal_id": meal_id,
            "qty": qty,
            "price": line_price,
        })

        update_meal_q = text("""
            update meals
            set surplus_qty = surplus_qty - :qty
            where id = :mid
        """)
        await db.execute(update_meal_q, {"qty": qty, "mid": meal_id})

    upd_order_q = text("""
        update orders
        set total = :total
        where id = :oid
        returning id, user_id, restaurant_id, status, total, created_at
    """)
    final_res = await db.execute(upd_order_q, {
        "total": total,
        "oid": order_id,
    })
    await db.commit()
    return dict(final_res.mappings().first())


@router.get("/mine")
async def list_my_orders(
    db: AsyncSession = Depends(get_db),
    user=Depends(current_user),
):
    user_id = str(user["id"]).strip()
    q = text("""
        select id, restaurant_id, status, total, created_at
        from orders
        where user_id = :uid
        order by created_at desc
    """)
    res = await db.execute(q, {"uid": user_id})
    rows = [dict(r) for r in res.mappings().all()]
    return rows


@router.get("/{order_id}")
async def get_order(
    order_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(current_user),
):
    q = text("""
        select o.id, o.user_id, o.restaurant_id, o.status, o.total, o.created_at,
               r.name as restaurant_name
        from orders o
        join restaurants r on r.id = o.restaurant_id
        where o.id = :oid
    """)
    res = await db.execute(q, {"oid": order_id})
    row = res.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="order not found")

    db_user_id = str(row["user_id"]).strip() if row["user_id"] is not None else ""
    current_id = str(user["id"]).strip() if user.get("id") is not None else ""

    if db_user_id != current_id:
        raise HTTPException(status_code=403, detail="not your order")

    items_q = text("""
        select oi.id, oi.meal_id, m.name as meal_name, oi.qty, oi.price
        from order_items oi
        join meals m on m.id = oi.meal_id
        where oi.order_id = :oid
        order by oi.id
    """)
    items_res = await db.execute(items_q, {"oid": order_id})
    items = [dict(r) for r in items_res.mappings().all()]

    return {
        "order": dict(row),
        "items": items,
    }


@router.patch("/{order_id}/cancel")
async def cancel_order(
    order_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(current_user),
):
    order_q = text("""
        select id, user_id, status
        from orders
        where id = :oid
        for update
    """)
    order_res = await db.execute(order_q, {"oid": order_id})
    order = order_res.mappings().first()
    if not order:
        raise HTTPException(status_code=404, detail="order not found")

    db_user_id = str(order["user_id"]).strip() if order["user_id"] is not None else ""
    current_id = str(user["id"]).strip() if user.get("id") is not None else ""

    if db_user_id != current_id:
        raise HTTPException(status_code=403, detail="not your order")

    if order["status"] != "pending":
        raise HTTPException(status_code=400, detail="cannot cancel after it is accepted")

    items_q = text("""
        select meal_id, qty
        from order_items
        where order_id = :oid
    """)
    items_res = await db.execute(items_q, {"oid": order_id})
    items = items_res.mappings().all()

    for it in items:
        upd_meal_q = text("""
            update meals
            set surplus_qty = surplus_qty + :qty
            where id = :mid
        """)
        await db.execute(upd_meal_q, {"qty": it["qty"], "mid": it["meal_id"]})

    upd_order_q = text("""
        update orders
        set status = 'cancelled'
        where id = :oid
    """)
    await db.execute(upd_order_q, {"oid": order_id})

    await db.commit()
    return {"status": "cancelled", "order_id": order_id}
