from fastapi import HTTPException
from database.database import database
from .schemas import MealCreate, MealUpdate

async def get_restaurant_by_owner(user_id: str) -> str:
    q = "SELECT id FROM restaurants WHERE owner_id = :user_id"
    row = await database.fetch_one(q, {"user_id": user_id})
    if not row:
        raise HTTPException(status_code=404, detail="No restaurant found for this owner")
    return str(row["id"])

async def create_meal(restaurant_id: str, meal: MealCreate):
    q = """
        INSERT INTO meals (restaurant_id, name, tags, base_price, quantity, surplus_price, allergens, calories, image_link)
        VALUES (:restaurant_id, :name, :tags, :base_price, :quantity, :surplus_price, :allergens, :calories, :image_link)
        RETURNING id, restaurant_id, name, tags, base_price, quantity, surplus_price, allergens, calories, image_link
    """
    row = await database.fetch_one(q, {
        "restaurant_id": str(restaurant_id),
        "name": meal.name,
        "tags": meal.tags, 
        "base_price": meal.base_price,
        "quantity": meal.quantity,
        "surplus_price": meal.surplus_price,
        "allergens": meal.allergens,
        "calories": meal.calories,
        "image_link": meal.image_link
    })
    result = dict(row)
    result["id"] = str(result["id"])
    result["restaurant_id"] = str(result["restaurant_id"])
    return result

async def update_meal(meal_id: str, restaurant_id: str, meal: MealUpdate):
    check = await database.fetch_one(
        "SELECT id FROM meals WHERE id = :meal_id AND restaurant_id = :restaurant_id",
        {"meal_id": meal_id, "restaurant_id": restaurant_id}
    )
    if not check:
        raise HTTPException(status_code=404, detail="Meal not found or not owned by your restaurant")
    
    updates = []
    params = {"meal_id": meal_id}
    
    if meal.name is not None:
        updates.append("name = :name")
        params["name"] = meal.name
    if meal.tags is not None:
        updates.append("tags = :tags")
        params["tags"] = meal.tags
    if meal.base_price is not None:
        updates.append("base_price = :base_price")
        params["base_price"] = meal.base_price
    if meal.quantity is not None:
        updates.append("quantity = :quantity")
        params["quantity"] = meal.quantity
    if meal.surplus_price is not None:
        updates.append("surplus_price = :surplus_price")
        params["surplus_price"] = meal.surplus_price
    if meal.allergens is not None:
        updates.append("allergens = :allergens")
        params["allergens"] = meal.allergens
    if meal.calories is not None:
        updates.append("calories = :calories")
        params["calories"] = meal.calories
    if meal.image_link is not None:
        updates.append("image_link = :image_link")
        params["image_link"] = meal.image_link
    
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    q = f"""
        UPDATE meals SET {', '.join(updates)}
        WHERE id = :meal_id
        RETURNING id, restaurant_id, name, tags, base_price, quantity, surplus_price, allergens, calories, image_link
    """
    row = await database.fetch_one(q, params)
    result = dict(row)
    result["id"] = str(result["id"])
    result["restaurant_id"] = str(result["restaurant_id"])
    return result

async def delete_meal(meal_id: str, restaurant_id: str):
    check = await database.fetch_one(
        "SELECT id FROM meals WHERE id = :meal_id AND restaurant_id = :restaurant_id",
        {"meal_id": meal_id, "restaurant_id": restaurant_id}
    )
    if not check:
        raise HTTPException(status_code=404, detail="Meal not found or not owned by your restaurant")
    
    await database.execute("DELETE FROM meals WHERE id = :meal_id", {"meal_id": meal_id})

async def get_restaurant_meals(restaurant_id: str):
    q = """
        SELECT id, restaurant_id, name, tags, base_price, quantity, surplus_price, allergens, calories, image_link
        FROM meals
        WHERE restaurant_id = :restaurant_id
        ORDER BY created_at DESC
    """
    rows = await database.fetch_all(q, {"restaurant_id": restaurant_id})
    return [{**dict(row), "id": str(row["id"]), "restaurant_id": str(row["restaurant_id"])} for row in rows]
