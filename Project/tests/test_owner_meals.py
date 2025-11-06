import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi import HTTPException
from app.owner_meals import service
from app.owner_meals.schemas import MealCreate, MealUpdate
from app.owner_meals.auth import require_owner
from app.owner_meals.router import router


@pytest.fixture
def sample_meal_create():
    return MealCreate(
        name="Test Meal",
        tags=["Indian", "Spicy"],
        base_price=10.0,
        quantity=20,
        surplus_price=8.0,
        allergens=["nuts"],
        calories=500,
        image_link="http://example.com/image.jpg"
    )


@pytest.fixture
def sample_meal_update():
    return MealUpdate(
        name="Updated Meal",
        quantity=15,
        surplus_price=7.0
    )


@pytest.fixture
def mock_owner_user():
    return {"id": "owner-uuid-123", "email": "owner@test.com", "role": "owner"}


@pytest.mark.asyncio
async def test_get_restaurant_by_owner_success():
    with patch('app.owner_meals.service.database') as mock_db:
        mock_db.fetch_one = AsyncMock(return_value={"id": "restaurant-uuid-123"})
        result = await service.get_restaurant_by_owner("owner-uuid-123")
        assert result == "restaurant-uuid-123"
        mock_db.fetch_one.assert_called_once()


@pytest.mark.asyncio
async def test_get_restaurant_by_owner_not_found():
    with patch('app.owner_meals.service.database') as mock_db:
        mock_db.fetch_one = AsyncMock(return_value=None)
        with pytest.raises(HTTPException) as exc:
            await service.get_restaurant_by_owner("owner-uuid-123")
        assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_create_meal_success(sample_meal_create):
    with patch('app.owner_meals.service.database') as mock_db:
        mock_db.fetch_one = AsyncMock(return_value={
            "id": "meal-uuid-123",
            "restaurant_id": "restaurant-uuid-123",
            "name": "Test Meal",
            "tags": ["Indian", "Spicy"],
            "base_price": 10.0,
            "quantity": 20,
            "surplus_price": 8.0,
            "allergens": ["nuts"],
            "calories": 500,
            "image_link": "http://example.com/image.jpg"
        })
        result = await service.create_meal("restaurant-uuid-123", sample_meal_create)
        assert result["name"] == "Test Meal"
        assert result["id"] == "meal-uuid-123"
        mock_db.fetch_one.assert_called_once()


@pytest.mark.asyncio
async def test_update_meal_success(sample_meal_update):
    with patch('app.owner_meals.service.database') as mock_db:
        mock_db.fetch_one = AsyncMock(side_effect=[
            {"id": "meal-uuid-123"},
            {
                "id": "meal-uuid-123",
                "restaurant_id": "restaurant-uuid-123",
                "name": "Updated Meal",
                "tags": ["Indian"],
                "base_price": 10.0,
                "quantity": 15,
                "surplus_price": 7.0,
                "allergens": ["nuts"],
                "calories": 500,
                "image_link": "http://example.com/image.jpg"
            }
        ])
        result = await service.update_meal("meal-uuid-123", "restaurant-uuid-123", sample_meal_update)
        assert result["name"] == "Updated Meal"
        assert result["quantity"] == 15


@pytest.mark.asyncio
async def test_update_meal_not_found(sample_meal_update):
    with patch('app.owner_meals.service.database') as mock_db:
        mock_db.fetch_one = AsyncMock(return_value=None)
        with pytest.raises(HTTPException) as exc:
            await service.update_meal("meal-uuid-123", "restaurant-uuid-123", sample_meal_update)
        assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_update_meal_no_fields():
    with patch('app.owner_meals.service.database') as mock_db:
        mock_db.fetch_one = AsyncMock(return_value={"id": "meal-uuid-123"})
        empty_update = MealUpdate()
        with pytest.raises(HTTPException) as exc:
            await service.update_meal("meal-uuid-123", "restaurant-uuid-123", empty_update)
        assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_delete_meal_success():
    with patch('app.owner_meals.service.database') as mock_db:
        mock_db.fetch_one = AsyncMock(return_value={"id": "meal-uuid-123"})
        mock_db.execute = AsyncMock()
        await service.delete_meal("meal-uuid-123", "restaurant-uuid-123")
        mock_db.execute.assert_called_once()


@pytest.mark.asyncio
async def test_delete_meal_not_found():
    with patch('app.owner_meals.service.database') as mock_db:
        mock_db.fetch_one = AsyncMock(return_value=None)
        with pytest.raises(HTTPException) as exc:
            await service.delete_meal("meal-uuid-123", "restaurant-uuid-123")
        assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_get_restaurant_meals_success():
    with patch('app.owner_meals.service.database') as mock_db:
        mock_db.fetch_all = AsyncMock(return_value=[
            {
                "id": "meal-uuid-1",
                "restaurant_id": "restaurant-uuid-123",
                "name": "Meal 1",
                "tags": ["Indian"],
                "base_price": 10.0,
                "quantity": 20,
                "surplus_price": 8.0,
                "allergens": [],
                "calories": 500,
                "image_link": None
            },
            {
                "id": "meal-uuid-2",
                "restaurant_id": "restaurant-uuid-123",
                "name": "Meal 2",
                "tags": ["Chinese"],
                "base_price": 12.0,
                "quantity": 15,
                "surplus_price": 10.0,
                "allergens": ["soy"],
                "calories": 600,
                "image_link": None
            }
        ])
        result = await service.get_restaurant_meals("restaurant-uuid-123")
        assert len(result) == 2
        assert result[0]["name"] == "Meal 1"
        assert result[1]["name"] == "Meal 2"


@pytest.mark.asyncio
async def test_get_restaurant_meals_empty():
    with patch('app.owner_meals.service.database') as mock_db:
        mock_db.fetch_all = AsyncMock(return_value=[])
        result = await service.get_restaurant_meals("restaurant-uuid-123")
        assert len(result) == 0


# Auth tests
@pytest.mark.asyncio
async def test_require_owner_success():
    with patch('app.owner_meals.auth.database') as mock_db:
        mock_db.fetch_one = AsyncMock(return_value={"role": "owner"})
        mock_user = {"id": "user-uuid-123", "email": "owner@test.com"}
        result = await require_owner(mock_user)
        assert result == mock_user


@pytest.mark.asyncio
async def test_require_owner_not_owner_role():
    with patch('app.owner_meals.auth.database') as mock_db:
        mock_db.fetch_one = AsyncMock(return_value={"role": "customer"})
        mock_user = {"id": "user-uuid-123", "email": "customer@test.com"}
        with pytest.raises(HTTPException) as exc:
            await require_owner(mock_user)
        assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_require_owner_user_not_found():
    with patch('app.owner_meals.auth.database') as mock_db:
        mock_db.fetch_one = AsyncMock(return_value=None)
        mock_user = {"id": "user-uuid-123", "email": "test@test.com"}
        with pytest.raises(HTTPException) as exc:
            await require_owner(mock_user)
        assert exc.value.status_code == 403


# Additional service tests
@pytest.mark.asyncio
async def test_create_meal_with_minimal_fields():
    with patch('app.owner_meals.service.database') as mock_db:
        minimal_meal = MealCreate(
            name="Simple Meal",
            base_price=5.0
        )
        mock_db.fetch_one = AsyncMock(return_value={
            "id": "meal-uuid-456",
            "restaurant_id": "restaurant-uuid-123",
            "name": "Simple Meal",
            "tags": None,
            "base_price": 5.0,
            "quantity": 0,
            "surplus_price": None,
            "allergens": None,
            "calories": None,
            "image_link": None
        })
        result = await service.create_meal("restaurant-uuid-123", minimal_meal)
        assert result["name"] == "Simple Meal"
        assert result["quantity"] == 0


@pytest.mark.asyncio
async def test_update_meal_all_fields():
    with patch('app.owner_meals.service.database') as mock_db:
        full_update = MealUpdate(
            name="Fully Updated",
            tags=["new", "tags"],
            base_price=15.0,
            quantity=30,
            surplus_price=12.0,
            allergens=["gluten"],
            calories=700,
            image_link="http://new.com/img.jpg"
        )
        mock_db.fetch_one = AsyncMock(side_effect=[
            {"id": "meal-uuid-123"},
            {
                "id": "meal-uuid-123",
                "restaurant_id": "restaurant-uuid-123",
                "name": "Fully Updated",
                "tags": ["new", "tags"],
                "base_price": 15.0,
                "quantity": 30,
                "surplus_price": 12.0,
                "allergens": ["gluten"],
                "calories": 700,
                "image_link": "http://new.com/img.jpg"
            }
        ])
        result = await service.update_meal("meal-uuid-123", "restaurant-uuid-123", full_update)
        assert result["name"] == "Fully Updated"
        assert result["calories"] == 700
        assert result["image_link"] == "http://new.com/img.jpg"


@pytest.mark.asyncio
async def test_update_meal_single_field():
    with patch('app.owner_meals.service.database') as mock_db:
        single_update = MealUpdate(quantity=50)
        mock_db.fetch_one = AsyncMock(side_effect=[
            {"id": "meal-uuid-123"},
            {
                "id": "meal-uuid-123",
                "restaurant_id": "restaurant-uuid-123",
                "name": "Original Meal",
                "tags": ["Indian"],
                "base_price": 10.0,
                "quantity": 50,
                "surplus_price": 8.0,
                "allergens": [],
                "calories": 500,
                "image_link": None
            }
        ])
        result = await service.update_meal("meal-uuid-123", "restaurant-uuid-123", single_update)
        assert result["quantity"] == 50


@pytest.mark.asyncio
async def test_create_meal_with_empty_lists():
    with patch('app.owner_meals.service.database') as mock_db:
        meal = MealCreate(
            name="Empty Lists Meal",
            tags=[],
            base_price=10.0,
            allergens=[]
        )
        mock_db.fetch_one = AsyncMock(return_value={
            "id": "meal-uuid-789",
            "restaurant_id": "restaurant-uuid-123",
            "name": "Empty Lists Meal",
            "tags": [],
            "base_price": 10.0,
            "quantity": 0,
            "surplus_price": None,
            "allergens": [],
            "calories": None,
            "image_link": None
        })
        result = await service.create_meal("restaurant-uuid-123", meal)
        assert result["tags"] == []
        assert result["allergens"] == []


@pytest.mark.asyncio
async def test_update_meal_with_zero_values():
    with patch('app.owner_meals.service.database') as mock_db:
        zero_update = MealUpdate(quantity=0, calories=0)
        mock_db.fetch_one = AsyncMock(side_effect=[
            {"id": "meal-uuid-123"},
            {
                "id": "meal-uuid-123",
                "restaurant_id": "restaurant-uuid-123",
                "name": "Meal",
                "tags": [],
                "base_price": 10.0,
                "quantity": 0,
                "surplus_price": 8.0,
                "allergens": [],
                "calories": 0,
                "image_link": None
            }
        ])
        result = await service.update_meal("meal-uuid-123", "restaurant-uuid-123", zero_update)
        assert result["quantity"] == 0
        assert result["calories"] == 0


@pytest.mark.asyncio
async def test_delete_meal_wrong_restaurant():
    with patch('app.owner_meals.service.database') as mock_db:
        mock_db.fetch_one = AsyncMock(return_value=None)
        with pytest.raises(HTTPException) as exc:
            await service.delete_meal("meal-uuid-123", "wrong-restaurant-uuid")
        assert exc.value.status_code == 404
        assert "not owned" in exc.value.detail.lower()


@pytest.mark.asyncio
async def test_get_restaurant_meals_with_nulls():
    with patch('app.owner_meals.service.database') as mock_db:
        mock_db.fetch_all = AsyncMock(return_value=[
            {
                "id": "meal-uuid-1",
                "restaurant_id": "restaurant-uuid-123",
                "name": "Meal with Nulls",
                "tags": None,
                "base_price": 10.0,
                "quantity": 5,
                "surplus_price": None,
                "allergens": None,
                "calories": None,
                "image_link": None
            }
        ])
        result = await service.get_restaurant_meals("restaurant-uuid-123")
        assert len(result) == 1
        assert result[0]["tags"] is None
        assert result[0]["surplus_price"] is None
