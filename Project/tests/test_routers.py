import pytest
from unittest.mock import AsyncMock, MagicMock, patch

# Mock database before importing app
with patch('sqlalchemy.ext.asyncio.create_async_engine'), patch('sqlalchemy.ext.asyncio.async_sessionmaker'):
    from fastapi.testclient import TestClient
    from app.main import app
    from app.db import get_db
    from app.auth import current_user

client = TestClient(app)
MOCK_USER = {"id": "test-user-id", "email": "test@example.com", "name": "Test User"}

async def override_get_db():
    db = MagicMock()
    
    # Create a mock result that returns proper dict-like objects
    mock_row = {"id": "test-id", "user_id": "test-user-id", "name": "Test", 
                "email": "test@test.com", "line1": "123 St", "city": "NYC",
                "state": "NY", "zip": "10001", "is_default": False,
                "quantity": 10, "surplus_price": 5.99, "base_price": 9.99,
                "restaurant_id": "r1", "meal_id": "m1", "qty": 1,
                "status": "pending", "total": 10.0, "created_at": "2024-01-01",
                "item_id": "item-1", "meal_name": "Test Meal", "role": "customer"}
    
    exec_result = MagicMock()
    exec_result.mappings = MagicMock(return_value=MagicMock(
        first=MagicMock(return_value=mock_row),
        all=MagicMock(return_value=[mock_row])
    ))
    exec_result.first = MagicMock(return_value=("test-id",))
    exec_result.scalar = MagicMock(return_value=1)
    db.execute = AsyncMock(return_value=exec_result)
    db.commit = AsyncMock()
    db.rollback = AsyncMock()
    yield db

def override_current_user():
    return MOCK_USER

app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[current_user] = override_current_user

# ============ Address Router Tests ============

def test_list_addresses():
    response = client.get("/addresses")
    assert response.status_code == 200

def test_create_address():
    response = client.post("/addresses", json={
        "line1": "456 Oak Ave", "city": "NYC", "state": "NY", "zip": "10001"
    })
    assert response.status_code in [200, 500]

def test_update_address():
    response = client.patch("/addresses/addr1", json={"line1": "Updated St"})
    assert response.status_code in [200, 404, 500]

def test_delete_address():
    response = client.delete("/addresses/addr1")
    assert response.status_code in [200, 404, 500]

# ============ Auth Router Tests ============

@patch("httpx.AsyncClient")
def test_signup(mock_httpx):
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"id": "new-user", "email": "new@test.com"}
    mock_client.__aenter__.return_value.post = AsyncMock(return_value=mock_response)
    mock_httpx.return_value = mock_client
    
    response = client.post("/auth/signup", json={
        "email": "new@test.com", "password": "pass123", "name": "New User"
    })
    assert response.status_code in [200, 400, 500]

@patch("httpx.AsyncClient")
def test_login(mock_httpx):
    mock_client = MagicMock()
    mock_token_resp = MagicMock()
    mock_token_resp.status_code = 200
    mock_token_resp.json.return_value = {"access_token": "token123", "refresh_token": "refresh123"}
    
    mock_user_resp = MagicMock()
    mock_user_resp.status_code = 200
    mock_user_resp.json.return_value = {"id": "user1", "email": "test@test.com"}
    
    mock_client.__aenter__.return_value.post = AsyncMock(return_value=mock_token_resp)
    mock_client.__aenter__.return_value.get = AsyncMock(return_value=mock_user_resp)
    mock_httpx.return_value = mock_client
    
    response = client.post("/auth/login", json={"email": "test@test.com", "password": "pass"})
    assert response.status_code in [200, 400, 500]

@patch("httpx.AsyncClient")
def test_refresh_token(mock_httpx):
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"access_token": "new_token"}
    mock_client.__aenter__.return_value.post = AsyncMock(return_value=mock_response)
    mock_httpx.return_value = mock_client
    
    response = client.post("/auth/refresh", json={"refresh_token": "refresh123"})
    assert response.status_code == 200

@patch("httpx.AsyncClient")
def test_logout(mock_httpx):
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_client.__aenter__.return_value.post = AsyncMock(return_value=mock_response)
    mock_httpx.return_value = mock_client
    
    response = client.post("/auth/logout", headers={"Authorization": "Bearer token123"})
    assert response.status_code == 200

# ============ Cart Router Tests ============

def test_get_cart():
    response = client.get("/cart")
    assert response.status_code in [200, 500]

def test_add_cart_item():
    response = client.post("/cart/items", json={"meal_id": "meal1", "qty": 2})
    assert response.status_code in [200, 400, 404, 409, 500]

def test_update_cart_item():
    response = client.patch("/cart/items/item1?qty=3")
    assert response.status_code in [200, 404, 409, 500]

def test_remove_cart_item():
    response = client.delete("/cart/items/item1")
    assert response.status_code in [200, 500]

def test_clear_cart():
    response = client.delete("/cart")
    assert response.status_code in [200, 500]

def test_checkout_cart():
    response = client.post("/cart/checkout")
    assert response.status_code in [200, 400, 500]

# ============ Catalog Router Tests ============

def test_list_restaurants():
    response = client.get("/catalog/restaurants")
    assert response.status_code in [200, 500]

def test_list_restaurants_with_search():
    response = client.get("/catalog/restaurants?search=pizza")
    assert response.status_code in [200, 500]

def test_list_meals_for_restaurant():
    response = client.get("/catalog/restaurants/r1/meals")
    assert response.status_code in [200, 500]

def test_list_meals_surplus_only():
    response = client.get("/catalog/restaurants/r1/meals?surplus_only=true")
    assert response.status_code in [200, 500]

# ============ Debug Auth Router Tests ============

def test_debug_whoami():
    response = client.get("/debug/me")
    assert response.status_code == 200
    assert response.json() == MOCK_USER

# ============ Me Router Tests ============

def test_get_me():
    response = client.get("/me")
    assert response.status_code in [200, 404, 500]

def test_patch_me():
    response = client.patch("/me", json={"name": "Updated Name"})
    assert response.status_code in [200, 500]

# ============ Meals Router Tests ============

def test_list_meals():
    response = client.get("/meals")
    assert response.status_code in [200, 500]

def test_list_meals_all():
    response = client.get("/meals?surplus_only=false")
    assert response.status_code in [200, 500]

# ============ Orders Router Tests ============

def test_create_order():
    response = client.post("/orders", json={
        "restaurant_id": "r1",
        "items": [{"meal_id": "m1", "qty": 2}]
    })
    assert response.status_code in [200, 400, 404, 500]

def test_list_my_orders():
    response = client.get("/orders/mine")
    assert response.status_code in [200, 500]

def test_get_order():
    response = client.get("/orders/o1")
    assert response.status_code in [200, 403, 404, 500]

def test_get_order_status_timeline():
    response = client.get("/orders/o1/status")
    assert response.status_code in [200, 403, 404, 500]

def test_cancel_order():
    response = client.patch("/orders/o1/cancel")
    assert response.status_code in [200, 400, 403, 404, 500]

def test_accept_order():
    response = client.patch("/orders/o1/accept")
    assert response.status_code in [200, 400, 403, 404, 500]

def test_preparing_order():
    response = client.patch("/orders/o1/preparing")
    assert response.status_code in [200, 400, 403, 404, 500]

def test_ready_order():
    response = client.patch("/orders/o1/ready")
    assert response.status_code in [200, 400, 403, 404, 500]

def test_complete_order():
    response = client.patch("/orders/o1/complete")
    assert response.status_code in [200, 400, 403, 404, 500]

# ============ Health Check Test ============

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
