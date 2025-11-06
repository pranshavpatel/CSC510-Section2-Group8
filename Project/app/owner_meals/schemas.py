from pydantic import BaseModel, Field
from typing import Optional, List

class MealCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    tags: Optional[List[str]] = None
    base_price: float = Field(..., gt=0)
    quantity: int = Field(default=0, ge=0)
    surplus_price: Optional[float] = Field(None, ge=0)
    allergens: Optional[List[str]] = None
    calories: Optional[int] = Field(None, ge=0)
    image_link: Optional[str] = None

class MealUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    tags: Optional[List[str]] = None
    base_price: Optional[float] = Field(None, gt=0)
    quantity: Optional[int] = Field(None, ge=0)
    surplus_price: Optional[float] = Field(None, ge=0)
    allergens: Optional[List[str]] = None
    calories: Optional[int] = Field(None, ge=0)
    image_link: Optional[str] = None

class MealResponse(BaseModel):
    id: str
    restaurant_id: str
    name: str
    tags: Optional[List[str]]
    base_price: float
    quantity: int
    surplus_price: Optional[float]
    allergens: Optional[List[str]]
    calories: Optional[int]
    image_link: Optional[str]
