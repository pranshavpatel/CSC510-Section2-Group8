# app/routers/cart.py
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Dict, Any
from ..db import get_db
from ..auth import current_user

router = APIRouter(prefix="/cart", tags=["cart"])

# ---------- helpers ----------

async def _get_or_create_cart_id(db: AsyncSession, user_id: str) -> str:
    uid = str(user_id).strip()
    q = text("select id from carts where user_id = :uid")
    r = await db.execute(q, {"uid": uid})
    row = r.mappings().first()
    if row:
        return row["id"]

    ins = text("insert into carts (user_id) values (:uid) returning id")
    r2 = await db.execute(ins, {"uid": uid})
    cart_id = r2.mappings().first()["id"]
    await db.commit()
    return cart_id


async def _get_cart_payload(db: AsyncSession, cart_id: str) -> Dict[str, Any]:
    """
    Returns items with CURRENT pricing (reads meals.surplus_price each time).
    NOTE: pricing/availability is volatile until checkout; no locks here.
    """
    q = text("""
        select
          ci.id as item_id,
          ci.meal_id,
          ci.qty,
          m.name as meal_name,
          m.restaurant_id,
          m.surplus_qty,
          m.surplus_price,
          m.base_price
        from cart_items ci
        join meals m on m.id = ci.meal_id
        where ci.cart_id = :cid
        order by ci.created_at
    """)
    rows = (await db.execute(q, {"cid": cart_id})).mappings().all()

    items = []
    total = 0.0
    for r in rows:
        unit_price = float(r["surplus_price"]) if r["surplus_price"] is not None else float(r["base_price"])
        qty = int(r["qty"])
        line_total = unit_price * qty
        total += line_total
        items.append({
            "item_id": r["item_id"],
            "meal_id": r["meal_id"],
            "meal_name": r["meal_name"],
            "restaurant_id": r["restaurant_id"],
            "qty": qty,
            "unit_price": unit_price,
            "line_total": line_total,
            "surplus_left": int(r["surplus_qty"]) if r["surplus_qty"] is not None else 0,
        })
    return {"cart_id": cart_id, "items": items, "cart_total": total}


# ---------- endpoints ----------

@router.get("")
async def get_my_cart(
    db: AsyncSession = Depends(get_db),
    user=Depends(current_user),
):
    cart_id = await _get_or_create_cart_id(db, user["id"])
    return await _get_cart_payload(db, cart_id)


@router.post("/items")
async def add_item(
    payload: dict,
    db: AsyncSession = Depends(get_db),
    user=Depends(current_user),
):
    """
    payload: { "meal_id": "...", "qty": 1 }
    If item exists: increments qty.
    Enforces qty <= meals.surplus_qty (optimistic check).
    """
    meal_id = payload.get("meal_id")
    add_qty = int(payload.get("qty") or 0)
    if not meal_id or add_qty <= 0:
        raise HTTPException(status_code=400, detail="meal_id and positive qty required")

    cart_id = await _get_or_create_cart_id(db, user["id"])

    meal_q = text("""
        select id, surplus_qty, surplus_price
        from meals
        where id = :mid
    """)
    mres = await db.execute(meal_q, {"mid": meal_id})
    meal = mres.mappings().first()
    if not meal:
        raise HTTPException(status_code=404, detail="meal not found")

    cur_q_q = text("""
        select qty from cart_items
        where cart_id = :cid and meal_id = :mid
    """)
    cur = (await db.execute(cur_q_q, {"cid": cart_id, "mid": meal_id})).mappings().first()
    current_qty = int(cur["qty"]) if cur else 0
    new_qty = current_qty + add_qty

    if meal["surplus_qty"] is not None and new_qty > int(meal["surplus_qty"]):
        raise HTTPException(status_code=409, detail=f"only {meal['surplus_qty']} left for this item")

    if cur:
        upd = text("""
            update cart_items
            set qty = :q
            where cart_id = :cid and meal_id = :mid
        """)
        await db.execute(upd, {"q": new_qty, "cid": cart_id, "mid": meal_id})
    else:
        ins = text("""
            insert into cart_items (cart_id, meal_id, qty)
            values (:cid, :mid, :qty)
        """)
        await db.execute(ins, {"cid": cart_id, "mid": meal_id, "qty": add_qty})

    await db.commit()
    return await _get_cart_payload(db, cart_id)


@router.patch("/items/{item_id}")
async def update_item_qty(
    item_id: str = Path(..., description="cart_items.id"),
    qty: int = Query(..., gt=0),
    db: AsyncSession = Depends(get_db),
    user=Depends(current_user),
):
    """
    Set exact qty for a cart item; qty>0.
    Enforces qty <= meals.surplus_qty (optimistic check).
    """
    cart_id = await _get_or_create_cart_id(db, user["id"])

    own_q = text("""
        select ci.meal_id, m.surplus_qty
        from cart_items ci
        join meals m on m.id = ci.meal_id
        where ci.id = :iid and ci.cart_id = :cid
    """)
    own = (await db.execute(own_q, {"iid": item_id, "cid": cart_id})).mappings().first()
    if not own:
        raise HTTPException(status_code=404, detail="item not found")

    if own["surplus_qty"] is not None and qty > int(own["surplus_qty"]):
        raise HTTPException(status_code=409, detail=f"only {own['surplus_qty']} left for this item")

    upd = text("update cart_items set qty=:q where id=:iid")
    await db.execute(upd, {"q": qty, "iid": item_id})
    await db.commit()
    return await _get_cart_payload(db, cart_id)


@router.delete("/items/{item_id}")
async def remove_item(
    item_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(current_user),
):
    cart_id = await _get_or_create_cart_id(db, user["id"])
    delq = text("delete from cart_items where id=:iid and cart_id=:cid")
    await db.execute(delq, {"iid": item_id, "cid": cart_id})
    await db.commit()
    return await _get_cart_payload(db, cart_id)


@router.delete("")
async def clear_cart(
    db: AsyncSession = Depends(get_db),
    user=Depends(current_user),
):
    cart_id = await _get_or_create_cart_id(db, user["id"])
    dq = text("delete from cart_items where cart_id=:cid")
    await db.execute(dq, {"cid": cart_id})
    await db.commit()
    return await _get_cart_payload(db, cart_id)


@router.post("/checkout")
async def checkout_cart(
    db: AsyncSession = Depends(get_db),
    user=Depends(current_user),
):
    """
    Converts cart -> order atomically:
      1) lock meals rows used
      2) verify surplus qty for surplus meals (if applicable)
      3) create order + order_items (price = surplus_price for surplus meals, base_price for regular meals)
      4) decrement meals.surplus_qty (only for surplus meals)
      5) write initial order_status_events('pending')
      6) clear cart
    
    Supports both surplus and regular meals in the same cart.
    """
    uid = str(user["id"]).strip()
    cart_id = await _get_or_create_cart_id(db, uid)

    try:
        items_q = text("""
            select ci.id as item_id, ci.meal_id, ci.qty,
                   m.surplus_qty, m.surplus_price, m.base_price, m.restaurant_id
            from cart_items ci
            join meals m on m.id = ci.meal_id
            where ci.cart_id = :cid
            for update of m
        """)
        rows = (await db.execute(items_q, {"cid": cart_id})).mappings().all()
        if not rows:
            raise HTTPException(status_code=400, detail="cart is empty")

        rest_ids = {r["restaurant_id"] for r in rows}
        if len(rest_ids) != 1:
            raise HTTPException(status_code=400, detail="cart contains items from multiple restaurants")
        restaurant_id = list(rest_ids)[0]

        total = 0.0
        for r in rows:
            # Check if this is a surplus meal or regular meal
            is_surplus = r["surplus_price"] is not None and r["surplus_qty"] is not None
            
            if is_surplus:
                # For surplus meals, check availability and use surplus_price
                if int(r["surplus_qty"]) < int(r["qty"]):
                    raise HTTPException(status_code=400, detail=f"not enough surplus for meal {r['meal_id']}")
                price_per_item = float(r["surplus_price"])
            else:
                # For regular meals, use base_price
                price_per_item = float(r["base_price"])
            
            total += price_per_item * int(r["qty"])

        create_order_q = text("""
            insert into orders (user_id, restaurant_id, status, total)
            values (:uid, :rid, 'pending', 0)
            returning id
        """)
        ores = await db.execute(create_order_q, {"uid": uid, "rid": restaurant_id})
        order_id = ores.mappings().first()["id"]

        for r in rows:
            # Determine if this is a surplus meal or regular meal
            is_surplus = r["surplus_price"] is not None and r["surplus_qty"] is not None
            
            if is_surplus:
                price_per_item = float(r["surplus_price"])
            else:
                price_per_item = float(r["base_price"])
            
            line_price = price_per_item * int(r["qty"])
            
            ins_item = text("""
                insert into order_items (order_id, meal_id, qty, price)
                values (:oid, :mid, :qty, :price)
            """)
            await db.execute(ins_item, {
                "oid": order_id,
                "mid": r["meal_id"],
                "qty": int(r["qty"]),
                "price": line_price,
            })

            # Only decrement surplus_qty for surplus meals
            if is_surplus:
                dec = text("""
                    update meals
                    set surplus_qty = surplus_qty - :qty
                    where id = :mid
                """)
                await db.execute(dec, {"qty": int(r["qty"]), "mid": r["meal_id"]})

        fin = text("update orders set total=:t where id=:oid")
        await db.execute(fin, {"t": total, "oid": order_id})

        # NEW: seed the timeline with 'pending' (safe cast syntax for asyncpg)
        seed_ev = text("""
            insert into order_status_events (order_id, status)
            values (:oid, cast(:status as order_status))
        """)
        await db.execute(seed_ev, {"oid": order_id, "status": "pending"})

        clr = text("delete from cart_items where cart_id=:cid")
        await db.execute(clr, {"cid": cart_id})

        await db.commit()
        return {"order_id": order_id, "status": "pending", "total": total}
    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"checkout failed: {str(e)}")
