# app/routers/orders.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import List, Dict, Any
from ..db import get_db
from ..auth import current_user

router = APIRouter()

ALLOWED_TRANSITIONS = {
    "pending":   {"accepted", "cancelled"},
    "accepted":  {"preparing", "cancelled"},
    "preparing": {"ready", "cancelled"},
    "ready":     {"completed"},
    "completed": set(),
    "cancelled": set(),
}

# ---- helpers ---------------------------------------------------------------

async def _append_status_event(db: AsyncSession, order_id: str, status: str):
    ins = text("""
        INSERT INTO order_status_events (order_id, status)
        VALUES (CAST(:oid AS uuid), CAST(:status AS order_status))
    """)
    await db.execute(ins, {"oid": order_id, "status": status})

async def _is_user_staff_for_order(db: AsyncSession, user_id: str, order_id: str) -> bool:
    q = text("""
        select 1
        from orders o
        join restaurant_staff rs on rs.restaurant_id = o.restaurant_id
        where o.id = :oid and rs.user_id = :uid
        limit 1
    """)
    r = await db.execute(q, {"oid": order_id, "uid": user_id})
    return r.scalar() == 1

async def _transition_order(db: AsyncSession, order_id: str, target: str):
    # Lock row and read current status
    q = text("""
        select id, status
        from orders
        where id = :oid
        for update
    """)
    row = (await db.execute(q, {"oid": order_id})).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="order not found")

    cur = row["status"]
    if target not in ALLOWED_TRANSITIONS.get(cur, set()):
        raise HTTPException(status_code=400, detail=f"invalid transition {cur} -> {target}")

    # Update status
    upd = text("""
        update orders
        set status = :target
        where id = :oid
        returning id, user_id, restaurant_id, status, total, created_at
    """)
    new_row = (await db.execute(upd, {"oid": order_id, "target": target})).mappings().first()

    # Append timeline event
    await _append_status_event(db, order_id, target)
    return dict(new_row)



# ---- routes ----------------------------------------------------------------

@router.post("")
async def create_order(
    payload: Dict[str, Any],
    db: AsyncSession = Depends(get_db),
    user=Depends(current_user),
):
    """
    Body:
    {
      "restaurant_id": "<uuid>",
      "items": [{"meal_id":"<uuid>", "qty": 2}, ...]
    }
    Behavior:
      - Creates order (pending)
      - Validates meals + surplus, inserts order_items, decrements surplus
      - Updates order total
      - Logs a 'pending' status event
    """
    restaurant_id = payload.get("restaurant_id")
    items: List[dict] = payload.get("items") or []
    if not restaurant_id or not items:
        raise HTTPException(status_code=400, detail="restaurant_id and items required")

    # 1) create order shell
    create_order_q = text("""
        insert into orders (user_id, restaurant_id, status, total)
        values (:user_id, :restaurant_id, 'pending', 0)
        returning id
    """)
    res = await db.execute(create_order_q, {
        "user_id": str(user["id"]).strip(),
        "restaurant_id": restaurant_id,
    })
    order_row = res.mappings().first()
    if not order_row:
        raise HTTPException(status_code=500, detail="failed to create order")
    order_id = order_row["id"]

    # Log initial status
    await _append_status_event(db, order_id, "pending")

    # 2) process items
    total = 0.0
    for it in items:
        meal_id = it.get("meal_id")
        try:
            qty = int(it.get("qty", 0))
        except Exception:
            qty = 0

        if not meal_id or qty <= 0:
            raise HTTPException(
                status_code=400,
                detail="each item needs meal_id and positive qty"
            )

        # lock row to keep surplus consistent
        meal_q = text("""
            select id, quantity, surplus_price, base_price
            from meals
            where id = :mid
            for update
        """)
        meal_res = await db.execute(meal_q, {"mid": meal_id})
        meal = meal_res.mappings().first()
        if not meal:
            raise HTTPException(status_code=404, detail=f"meal {meal_id} not found")
        if (meal["quantity"] or 0) < qty:
            raise HTTPException(status_code=400, detail=f"not enough surplus for meal {meal_id}")

        line_price = float(meal["surplus_price"]) * qty
        total += line_price

        # add order item
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
            set quantity = quantity - :qty
            where id = :mid
        """)
        await db.execute(update_meal_q, {"qty": qty, "mid": meal_id})

    # 3) finalize order total and return
    upd_order_q = text("""
        update orders
        set total = :total
        where id = :oid
        returning id, user_id, restaurant_id, status, total, created_at
    """)
    final_res = await db.execute(upd_order_q, {"total": total, "oid": order_id})
    final_row = final_res.mappings().first()
    await db.commit()
    return dict(final_row)


@router.get("/mine")
async def list_my_orders(
    db: AsyncSession = Depends(get_db),
    user=Depends(current_user),
    limit: int = Query(default=50, le=100),
):
    """
    List current user's orders newest-first.
    """
    user_id = str(user["id"]).strip()
    q = text("""
        select id, restaurant_id, status, total, created_at
        from orders
        where user_id = :uid
        order by created_at desc
        limit :limit
    """)
    res = await db.execute(q, {"uid": user_id, "limit": limit})
    rows = [dict(r) for r in res.mappings().all()]
    return rows


@router.get("/{order_id}")
async def get_order(
    order_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(current_user),
):
    """
    Get a single order (must be owned by current user).
    """
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


@router.get("/{order_id}/status")
async def get_order_status_timeline(
    order_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(current_user),
):
    """
    Returns the chronological status timeline for an order (user must own the order).
    """
    # validate ownership
    own_q = text("select user_id from orders where id = :oid")
    own_res = await db.execute(own_q, {"oid": order_id})
    own = own_res.mappings().first()
    if not own:
        raise HTTPException(status_code=404, detail="order not found")

    db_user_id = str(own["user_id"]).strip() if own["user_id"] is not None else ""
    current_id = str(user["id"]).strip() if user.get("id") is not None else ""
    if db_user_id != current_id:
        raise HTTPException(status_code=403, detail="not your order")

    # fetch events
    ev_q = text("""
        select status, created_at
        from order_status_events
        where order_id = :oid
        order by created_at asc
    """)
    ev_res = await db.execute(ev_q, {"oid": order_id})
    events = [dict(r) for r in ev_res.mappings().all()]
    return {"order_id": order_id, "timeline": events}


@router.patch("/{order_id}/cancel")
async def cancel_order(
    order_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(current_user),
):
    """
    Cancel an order you own (only when status is 'pending').
    Restores meal surplus and logs a 'cancelled' status event.
    """
    # lock the order row
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

    # restore surplus for each item
    items_q = text("""
        select meal_id, qty
        from order_items
        where order_id = :oid
    """)
    items_res = await db.execute(items_q, {"oid": order_id})
    for it in items_res.mappings().all():
        upd_meal_q = text("""
            update meals
            set quantity = quantity + :qty
            where id = :mid
        """)
        await db.execute(upd_meal_q, {"qty": it["qty"], "mid": it["meal_id"]})

    # set order status + log event
    upd_order_q = text("""
        update orders
        set status = 'cancelled'
        where id = :oid
    """)
    await db.execute(upd_order_q, {"oid": order_id})
    await _append_status_event(db, order_id, "cancelled")

    await db.commit()
    return {"status": "cancelled", "order_id": order_id}

@router.patch("/{order_id}/accept")
async def accept_order(
    order_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(current_user),
):
    # restaurant staff only
    if not await _is_user_staff_for_order(db, str(user["id"]).strip(), order_id):
        raise HTTPException(status_code=403, detail="not allowed")
    out = await _transition_order(db, order_id, "accepted")
    await db.commit()
    return out


@router.patch("/{order_id}/preparing")
async def preparing_order(
    order_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(current_user),
):
    if not await _is_user_staff_for_order(db, str(user["id"]).strip(), order_id):
        raise HTTPException(status_code=403, detail="not allowed")
    out = await _transition_order(db, order_id, "preparing")
    await db.commit()
    return out


@router.patch("/{order_id}/ready")
async def ready_order(
    order_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(current_user),
):
    if not await _is_user_staff_for_order(db, str(user["id"]).strip(), order_id):
        raise HTTPException(status_code=403, detail="not allowed")
    out = await _transition_order(db, order_id, "ready")
    await db.commit()
    return out


@router.patch("/{order_id}/complete")
async def complete_order(
    order_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(current_user),
):
    if not await _is_user_staff_for_order(db, str(user["id"]).strip(), order_id):
        raise HTTPException(status_code=403, detail="not allowed")
    out = await _transition_order(db, order_id, "completed")
    await db.commit()
    return out