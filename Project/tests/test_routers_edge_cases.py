import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import HTTPException

with patch('sqlalchemy.ext.asyncio.create_async_engine'), patch('sqlalchemy.ext.asyncio.async_sessionmaker'):
    from fastapi.testclient import TestClient
    from app.main import app
    from app.db import get_db
    from app.auth import current_user

client = TestClient(app)
MOCK_USER = {"id": "test-user-id", "email": "test@example.com", "name": "Test User"}

# ============ Address Router Edge Cases ============

def test_create_address_missing_required_fields():
    app.dependency_overrides[current_user] = lambda: MOCK_USER
    response = client.post("/addresses", json={"line1": "123 St"})
    assert response.status_code == 422

def test_create_address_invalid_zip():
    async def mock_db():
        db = MagicMock()
        exec_result = MagicMock()
        exec_result.mappings = MagicMock(return_value=MagicMock(
            first=MagicMock(return_value={"id": "addr1", "zip": ""})
        ))
        db.execute = AsyncMock(return_value=exec_result)
        db.commit = AsyncMock()
        yield db
    
    app.dependency_overrides[get_db] = mock_db
    app.dependency_overrides[current_user] = lambda: MOCK_USER
    response = client.post("/addresses", json={
        "line1": "123 St", "city": "NYC", "state": "NY", "zip": ""
    })
    assert response.status_code in [200, 422]

def test_update_address_not_found():
    async def mock_db_not_found():
        db = MagicMock()
        exec_result = MagicMock()
        exec_result.first = MagicMock(return_value=None)
        exec_result.mappings = MagicMock(return_value=MagicMock(first=MagicMock(return_value=None)))
        db.execute = AsyncMock(return_value=exec_result)
        db.commit = AsyncMock()
        yield db
    
    app.dependency_overrides[get_db] = mock_db_not_found
    app.dependency_overrides[current_user] = lambda: MOCK_USER
    response = client.patch("/addresses/nonexistent", json={"line1": "New St"})
    assert response.status_code == 404

def test_delete_address_not_found():
    async def mock_db_not_found():
        db = MagicMock()
        exec_result = MagicMock()
        exec_result.first = MagicMock(return_value=None)
        db.execute = AsyncMock(return_value=exec_result)
        db.commit = AsyncMock()
        yield db
    
    app.dependency_overrides[get_db] = mock_db_not_found
    app.dependency_overrides[current_user] = lambda: MOCK_USER
    response = client.delete("/addresses/nonexistent")
    assert response.status_code == 404

def test_list_addresses_empty():
    async def mock_db_empty():
        db = MagicMock()
        exec_result = MagicMock()
        exec_result.mappings = MagicMock(return_value=MagicMock(all=MagicMock(return_value=[])))
        db.execute = AsyncMock(return_value=exec_result)
        yield db
    
    app.dependency_overrides[get_db] = mock_db_empty
    app.dependency_overrides[current_user] = lambda: MOCK_USER
    response = client.get("/addresses")
    assert response.status_code == 200
    assert response.json() == []

# ============ Auth Router Edge Cases ============

@patch("httpx.AsyncClient")
def test_signup_duplicate_email(mock_httpx):
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.status_code = 400
    mock_response.json.return_value = {"message": "User already exists"}
    mock_client.__aenter__.return_value.post = AsyncMock(return_value=mock_response)
    mock_httpx.return_value = mock_client
    
    response = client.post("/auth/signup", json={
        "email": "existing@test.com", "password": "pass123", "name": "User"
    })
    assert response.status_code == 400

@patch("httpx.AsyncClient")
def test_login_invalid_credentials(mock_httpx):
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.status_code = 400
    mock_client.__aenter__.return_value.post = AsyncMock(return_value=mock_response)
    mock_httpx.return_value = mock_client
    
    response = client.post("/auth/login", json={"email": "test@test.com", "password": "wrong"})
    assert response.status_code == 400

@patch("httpx.AsyncClient")
def test_login_missing_email(mock_httpx):
    response = client.post("/auth/login", json={"password": "pass123"})
    assert response.status_code == 422

@patch("httpx.AsyncClient")
def test_login_missing_password(mock_httpx):
    response = client.post("/auth/login", json={"email": "test@test.com"})
    assert response.status_code == 422

@patch("httpx.AsyncClient")
def test_refresh_token_invalid(mock_httpx):
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.status_code = 401
    mock_response.json.return_value = {"message": "Invalid refresh token"}
    mock_client.__aenter__.return_value.post = AsyncMock(return_value=mock_response)
    mock_httpx.return_value = mock_client
    
    response = client.post("/auth/refresh", json={"refresh_token": "invalid"})
    assert response.status_code == 401

@patch("httpx.AsyncClient")
def test_logout_missing_token(mock_httpx):
    response = client.post("/auth/logout")
    assert response.status_code == 401

# ============ Cart Router Edge Cases ============

def test_add_cart_item_missing_meal_id():
    app.dependency_overrides[current_user] = lambda: MOCK_USER
    response = client.post("/cart/items", json={"qty": 2})
    assert response.status_code in [400, 422]

def test_add_cart_item_invalid_qty():
    app.dependency_overrides[current_user] = lambda: MOCK_USER
    response = client.post("/cart/items", json={"meal_id": "m1", "qty": 0})
    assert response.status_code == 400

def test_add_cart_item_negative_qty():
    app.dependency_overrides[current_user] = lambda: MOCK_USER
    response = client.post("/cart/items", json={"meal_id": "m1", "qty": -1})
    assert response.status_code == 400

def test_add_cart_item_meal_not_found():
    async def mock_db_meal_not_found():
        db = MagicMock()
        exec_result = MagicMock()
        exec_result.mappings = MagicMock(return_value=MagicMock(
            first=MagicMock(side_effect=[{"id": "cart1"}, None])
        ))
        db.execute = AsyncMock(return_value=exec_result)
        db.commit = AsyncMock()
        yield db
    
    app.dependency_overrides[get_db] = mock_db_meal_not_found
    app.dependency_overrides[current_user] = lambda: MOCK_USER
    response = client.post("/cart/items", json={"meal_id": "nonexistent", "qty": 1})
    assert response.status_code == 404

def test_add_cart_item_exceeds_quantity():
    async def mock_db_insufficient_qty():
        db = MagicMock()
        exec_result = MagicMock()
        exec_result.mappings = MagicMock(return_value=MagicMock(
            first=MagicMock(side_effect=[
                {"id": "cart1"},
                {"id": "m1", "quantity": 2, "surplus_price": 5.99},
                None
            ])
        ))
        db.execute = AsyncMock(return_value=exec_result)
        db.commit = AsyncMock()
        yield db
    
    app.dependency_overrides[get_db] = mock_db_insufficient_qty
    app.dependency_overrides[current_user] = lambda: MOCK_USER
    response = client.post("/cart/items", json={"meal_id": "m1", "qty": 10})
    assert response.status_code == 409

def test_update_cart_item_invalid_qty():
    app.dependency_overrides[current_user] = lambda: MOCK_USER
    response = client.patch("/cart/items/item1?qty=0")
    assert response.status_code == 422

def test_update_cart_item_not_found():
    async def mock_db_item_not_found():
        db = MagicMock()
        exec_result = MagicMock()
        exec_result.mappings = MagicMock(return_value=MagicMock(
            first=MagicMock(side_effect=[{"id": "cart1"}, None])
        ))
        db.execute = AsyncMock(return_value=exec_result)
        db.commit = AsyncMock()
        yield db
    
    app.dependency_overrides[get_db] = mock_db_item_not_found
    app.dependency_overrides[current_user] = lambda: MOCK_USER
    response = client.patch("/cart/items/nonexistent?qty=2")
    assert response.status_code == 404

def test_checkout_empty_cart():
    async def mock_db_empty_cart():
        db = MagicMock()
        exec_result = MagicMock()
        exec_result.mappings = MagicMock(return_value=MagicMock(
            first=MagicMock(return_value={"id": "cart1"}),
            all=MagicMock(return_value=[])
        ))
        db.execute = AsyncMock(return_value=exec_result)
        db.commit = AsyncMock()
        db.rollback = AsyncMock()
        yield db
    
    app.dependency_overrides[get_db] = mock_db_empty_cart
    app.dependency_overrides[current_user] = lambda: MOCK_USER
    response = client.post("/cart/checkout")
    assert response.status_code == 400

def test_checkout_multiple_restaurants():
    async def mock_db_multi_restaurant():
        db = MagicMock()
        exec_result = MagicMock()
        exec_result.mappings = MagicMock(return_value=MagicMock(
            first=MagicMock(return_value={"id": "cart1"}),
            all=MagicMock(return_value=[
                {"meal_id": "m1", "qty": 1, "quantity": 10, "surplus_price": 5.99, 
                 "base_price": 9.99, "restaurant_id": "r1"},
                {"meal_id": "m2", "qty": 1, "quantity": 10, "surplus_price": 6.99, 
                 "base_price": 10.99, "restaurant_id": "r2"}
            ])
        ))
        db.execute = AsyncMock(return_value=exec_result)
        db.commit = AsyncMock()
        db.rollback = AsyncMock()
        yield db
    
    app.dependency_overrides[get_db] = mock_db_multi_restaurant
    app.dependency_overrides[current_user] = lambda: MOCK_USER
    response = client.post("/cart/checkout")
    assert response.status_code == 400

# ============ Catalog Router Edge Cases ============

def test_list_restaurants_with_pagination():
    async def mock_db():
        db = MagicMock()
        exec_result = MagicMock()
        exec_result.mappings = MagicMock(return_value=MagicMock(all=MagicMock(return_value=[])))
        db.execute = AsyncMock(return_value=exec_result)
        yield db
    
    app.dependency_overrides[get_db] = mock_db
    response = client.get("/catalog/restaurants?limit=10&offset=20")
    assert response.status_code == 200

def test_list_restaurants_invalid_limit():
    response = client.get("/catalog/restaurants?limit=200")
    assert response.status_code == 422

def test_list_restaurants_negative_offset():
    response = client.get("/catalog/restaurants?offset=-1")
    assert response.status_code == 422

def test_list_meals_invalid_sort():
    async def mock_db():
        db = MagicMock()
        exec_result = MagicMock()
        exec_result.mappings = MagicMock(return_value=MagicMock(all=MagicMock(return_value=[])))
        db.execute = AsyncMock(return_value=exec_result)
        yield db
    
    app.dependency_overrides[get_db] = mock_db
    response = client.get("/catalog/restaurants/r1/meals?sort=invalid")
    assert response.status_code == 200

# ============ Me Router Edge Cases ============

def test_get_me_user_not_found():
    async def mock_db_user_not_found():
        db = MagicMock()
        exec_result = MagicMock()
        exec_result.mappings = MagicMock(return_value=MagicMock(first=MagicMock(return_value=None)))
        db.execute = AsyncMock(return_value=exec_result)
        yield db
    
    app.dependency_overrides[get_db] = mock_db_user_not_found
    app.dependency_overrides[current_user] = lambda: MOCK_USER
    response = client.get("/me")
    assert response.status_code == 404

def test_patch_me_empty_payload():
    async def mock_db():
        db = MagicMock()
        exec_result = MagicMock()
        exec_result.mappings = MagicMock(return_value=MagicMock(
            first=MagicMock(return_value=MOCK_USER)
        ))
        db.execute = AsyncMock(return_value=exec_result)
        db.commit = AsyncMock()
        yield db
    
    app.dependency_overrides[get_db] = mock_db
    app.dependency_overrides[current_user] = lambda: MOCK_USER
    response = client.patch("/me", json={})
    assert response.status_code == 200

# ============ Meals Router Edge Cases ============

def test_list_meals_with_limit():
    async def mock_db():
        db = MagicMock()
        exec_result = MagicMock()
        exec_result.mappings = MagicMock(return_value=MagicMock(all=MagicMock(return_value=[])))
        db.execute = AsyncMock(return_value=exec_result)
        yield db
    
    app.dependency_overrides[get_db] = mock_db
    response = client.get("/meals?limit=10")
    assert response.status_code == 200

def test_list_meals_invalid_limit():
    response = client.get("/meals?limit=200")
    assert response.status_code == 422

# ============ Orders Router Edge Cases ============

def test_create_order_missing_restaurant_id():
    app.dependency_overrides[current_user] = lambda: MOCK_USER
    response = client.post("/orders", json={"items": [{"meal_id": "m1", "qty": 1}]})
    assert response.status_code == 400

def test_create_order_missing_items():
    app.dependency_overrides[current_user] = lambda: MOCK_USER
    response = client.post("/orders", json={"restaurant_id": "r1"})
    assert response.status_code == 400

def test_create_order_empty_items():
    app.dependency_overrides[current_user] = lambda: MOCK_USER
    response = client.post("/orders", json={"restaurant_id": "r1", "items": []})
    assert response.status_code == 400

def test_create_order_invalid_qty():
    app.dependency_overrides[current_user] = lambda: MOCK_USER
    response = client.post("/orders", json={
        "restaurant_id": "r1",
        "items": [{"meal_id": "m1", "qty": 0}]
    })
    assert response.status_code == 400

def test_create_order_meal_not_found():
    async def mock_db_meal_not_found():
        db = MagicMock()
        exec_result = MagicMock()
        exec_result.mappings = MagicMock(return_value=MagicMock(
            first=MagicMock(side_effect=[{"id": "order1"}, None])
        ))
        db.execute = AsyncMock(return_value=exec_result)
        db.commit = AsyncMock()
        db.rollback = AsyncMock()
        yield db
    
    app.dependency_overrides[get_db] = mock_db_meal_not_found
    app.dependency_overrides[current_user] = lambda: MOCK_USER
    response = client.post("/orders", json={
        "restaurant_id": "r1",
        "items": [{"meal_id": "nonexistent", "qty": 1}]
    })
    assert response.status_code == 404

def test_create_order_insufficient_quantity():
    async def mock_db_insufficient():
        db = MagicMock()
        exec_result = MagicMock()
        exec_result.mappings = MagicMock(return_value=MagicMock(
            first=MagicMock(side_effect=[
                {"id": "order1"},
                {"id": "m1", "quantity": 1, "surplus_price": 5.99, "base_price": 9.99}
            ])
        ))
        db.execute = AsyncMock(return_value=exec_result)
        db.commit = AsyncMock()
        db.rollback = AsyncMock()
        yield db
    
    app.dependency_overrides[get_db] = mock_db_insufficient
    app.dependency_overrides[current_user] = lambda: MOCK_USER
    response = client.post("/orders", json={
        "restaurant_id": "r1",
        "items": [{"meal_id": "m1", "qty": 10}]
    })
    assert response.status_code == 400

def test_get_order_not_found():
    async def mock_db_not_found():
        db = MagicMock()
        exec_result = MagicMock()
        exec_result.mappings = MagicMock(return_value=MagicMock(first=MagicMock(return_value=None)))
        db.execute = AsyncMock(return_value=exec_result)
        yield db
    
    app.dependency_overrides[get_db] = mock_db_not_found
    app.dependency_overrides[current_user] = lambda: MOCK_USER
    response = client.get("/orders/nonexistent")
    assert response.status_code == 404

def test_get_order_wrong_user():
    async def mock_db_wrong_user():
        db = MagicMock()
        exec_result = MagicMock()
        exec_result.mappings = MagicMock(return_value=MagicMock(
            first=MagicMock(return_value={"id": "o1", "user_id": "other-user"})
        ))
        db.execute = AsyncMock(return_value=exec_result)
        yield db
    
    app.dependency_overrides[get_db] = mock_db_wrong_user
    app.dependency_overrides[current_user] = lambda: MOCK_USER
    response = client.get("/orders/o1")
    assert response.status_code == 403

def test_cancel_order_not_pending():
    async def mock_db_not_pending():
        db = MagicMock()
        exec_result = MagicMock()
        exec_result.mappings = MagicMock(return_value=MagicMock(
            first=MagicMock(return_value={"id": "o1", "user_id": "test-user-id", "status": "accepted"})
        ))
        db.execute = AsyncMock(return_value=exec_result)
        db.commit = AsyncMock()
        db.rollback = AsyncMock()
        yield db
    
    app.dependency_overrides[get_db] = mock_db_not_pending
    app.dependency_overrides[current_user] = lambda: MOCK_USER
    response = client.patch("/orders/o1/cancel")
    assert response.status_code == 400

def test_accept_order_not_staff():
    async def mock_db_not_staff():
        db = MagicMock()
        exec_result = MagicMock()
        exec_result.scalar = MagicMock(return_value=None)
        db.execute = AsyncMock(return_value=exec_result)
        yield db
    
    app.dependency_overrides[get_db] = mock_db_not_staff
    app.dependency_overrides[current_user] = lambda: MOCK_USER
    response = client.patch("/orders/o1/accept")
    assert response.status_code == 403

def test_order_invalid_transition():
    async def mock_db_invalid_transition():
        db = MagicMock()
        exec_result = MagicMock()
        exec_result.scalar = MagicMock(return_value=1)
        exec_result.mappings = MagicMock(return_value=MagicMock(
            first=MagicMock(return_value={"id": "o1", "status": "completed"})
        ))
        db.execute = AsyncMock(return_value=exec_result)
        db.commit = AsyncMock()
        yield db
    
    app.dependency_overrides[get_db] = mock_db_invalid_transition
    app.dependency_overrides[current_user] = lambda: MOCK_USER
    response = client.patch("/orders/o1/accept")
    assert response.status_code == 400

def test_list_my_orders_with_limit():
    async def mock_db():
        db = MagicMock()
        exec_result = MagicMock()
        exec_result.mappings = MagicMock(return_value=MagicMock(all=MagicMock(return_value=[])))
        db.execute = AsyncMock(return_value=exec_result)
        yield db
    
    app.dependency_overrides[get_db] = mock_db
    app.dependency_overrides[current_user] = lambda: MOCK_USER
    response = client.get("/orders/mine?limit=10")
    assert response.status_code == 200

def test_list_my_orders_invalid_limit():
    app.dependency_overrides[current_user] = lambda: MOCK_USER
    response = client.get("/orders/mine?limit=200")
    assert response.status_code == 422

# ============ Authentication Edge Cases ============

def test_endpoint_without_auth():
    app.dependency_overrides.clear()
    response = client.get("/addresses")
    assert response.status_code == 403

def test_cart_without_auth():
    app.dependency_overrides.clear()
    response = client.get("/cart")
    assert response.status_code == 403

def test_orders_without_auth():
    app.dependency_overrides.clear()
    response = client.get("/orders/mine")
    assert response.status_code == 403
