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
    """
    Expects:
    {
      "restaurant_id": "...",
      "items": [
        {"meal_id": "...", "qty": 2},
        ...
      ]
    }
    - user_id is taken from token (customer)
    - we will:
      1) create order
      2) for each item:
         - check meal exists
         - check surplus
         - compute line price = surplus_price * qty
         - decrement surplus
      3) update order total
    """
    restaurant_id = payload.get("restaurant_id")
    items: List[dict] = payload.get("items") or []
    if not restaurant_id or not items:
        raise HTTPException(status_code=400, detail="restaurant_id and items required")

    # 1) create order (pending) for current user
    create_order_q = text("""
        insert into orders (user_id, restaurant_id, status, total)
        values (:user_id, :restaurant_id, 'pending', 0)
        returning id
    """)
    res = await db.execute(create_order_q, {
        "user_id": user["id"],
        "restaurant_id": restaurant_id,
    })
    order_row = res.mappings().first()
    order_id = order_row["id"]

    total = 0.0

    for it in items:
        meal_id = it.get("meal_id")
        qty = int(it.get("qty", 0))
        if not meal_id or qty <= 0:
            raise HTTPException(status_code=400, detail="each item needs meal_id and positive qty")

        # get meal info
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

        # insert order_item
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

        # decrement surplus
        update_meal_q = text("""
            update meals
            set surplus_qty = surplus_qty - :qty
            where id = :mid
        """)
        await db.execute(update_meal_q, {"qty": qty, "mid": meal_id})

    # update order total
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
    final_order = final_res.mappings().first()

    await db.commit()
    return dict(final_order)


@router.get("/mine")
async def my_orders(
    db: AsyncSession = Depends(get_db),
    user=Depends(current_user),
):
    q = text("""
        select o.id, o.restaurant_id, o.status, o.total, o.created_at,
               r.name as restaurant_name
        from orders o
        join restaurants r on o.restaurant_id = r.id
        where o.user_id = :uid
        order by o.created_at desc
        limit 50
    """)
    rows = (await db.execute(q, {"uid": user["id"]})).mappings().all()
    return [dict(r) for r in rows]


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

    # normalize ids
    db_user_id = str(row["user_id"]).strip() if row["user_id"] is not None else ""
    current_id = str(user["id"]).strip() if user.get("id") is not None else ""    

    if db_user_id != current_id:
        raise HTTPException(status_code=403, detail="not your order")

    # fetch items
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
    # lock the order
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

    # restore surplus
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
