from fastapi import APIRouter, Depends
from .schemas import MealCreate, MealUpdate, MealResponse
from .auth import require_owner
from . import service
from typing import List

router = APIRouter()

@router.post("", response_model=MealResponse, status_code=201)
async def add_meal(
    meal: MealCreate,
    user: dict = Depends(require_owner)
):
    restaurant_id = await service.get_restaurant_by_owner(user["id"])
    return await service.create_meal(restaurant_id, meal)

@router.put("/{meal_id}", response_model=MealResponse)
async def modify_meal(
    meal_id: str,
    meal: MealUpdate,
    user: dict = Depends(require_owner)
):
    restaurant_id = await service.get_restaurant_by_owner(user["id"])
    return await service.update_meal(meal_id, restaurant_id, meal)

@router.delete("/{meal_id}", status_code=204)
async def remove_meal(
    meal_id: str,
    user: dict = Depends(require_owner)
):
    restaurant_id = await service.get_restaurant_by_owner(user["id"])
    await service.delete_meal(meal_id, restaurant_id)

@router.get("", response_model=List[MealResponse])
async def list_my_meals(
    user: dict = Depends(require_owner)
):
    restaurant_id = await service.get_restaurant_by_owner(user["id"])
    return await service.get_restaurant_meals(restaurant_id)
