import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi import HTTPException
import time


@pytest.fixture
def mock_user():
    return {"id": "user-123", "email": "test@example.com"}


@pytest.mark.asyncio
async def test_spotify_login_success(mock_user):
    with patch('Mood2FoodRecSys.Spotify_Auth.SPOTIFY_CLIENT_ID', 'test_client_id'), \
         patch('Mood2FoodRecSys.Spotify_Auth.SPOTIFY_REDIRECT_URI', 'http://localhost/callback'), \
         patch('Mood2FoodRecSys.Spotify_Auth.SPOTIFY_SCOPES', 'user-read-email'):
        
        from Mood2FoodRecSys.Spotify_Auth import spotify_login
        
        result = await spotify_login(user=mock_user)
        
        assert "auth_url" in result
        assert "accounts.spotify.com/authorize" in result["auth_url"]
        assert "client_id=test_client_id" in result["auth_url"]


@pytest.mark.asyncio
async def test_spotify_login_missing_config(mock_user):
    with patch('Mood2FoodRecSys.Spotify_Auth.SPOTIFY_CLIENT_ID', None):
        from Mood2FoodRecSys.Spotify_Auth import spotify_login
        
        with pytest.raises(HTTPException) as exc:
            await spotify_login(user=mock_user)
        assert exc.value.status_code == 500


@pytest.mark.asyncio
async def test_spotify_callback_success():
    with patch('Mood2FoodRecSys.Spotify_Auth.SPOTIFY_CLIENT_ID', 'client_id'), \
         patch('Mood2FoodRecSys.Spotify_Auth.SPOTIFY_CLIENT_SECRET', 'client_secret'), \
         patch('Mood2FoodRecSys.Spotify_Auth.SPOTIFY_REDIRECT_URI', 'http://localhost/callback'), \
         patch('Mood2FoodRecSys.Spotify_Auth.requests.post') as mock_post, \
         patch('Mood2FoodRecSys.Spotify_Auth.database') as mock_db:
        
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "access_token": "test_access",
            "refresh_token": "test_refresh",
            "expires_in": 3600
        }
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response
        
        mock_db.fetch_val = AsyncMock(return_value=None)
        mock_db.execute = AsyncMock()
        
        from Mood2FoodRecSys.Spotify_Auth import spotify_callback
        
        result = await spotify_callback(code="test_code", state="user-123")
        
        assert result.status_code == 307
        mock_db.execute.assert_called_once()


@pytest.mark.asyncio
async def test_spotify_callback_missing_code():
    from Mood2FoodRecSys.Spotify_Auth import spotify_callback
    
    with pytest.raises(HTTPException) as exc:
        await spotify_callback(code="", state="user-123")
    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_spotify_callback_missing_state():
    from Mood2FoodRecSys.Spotify_Auth import spotify_callback
    
    with pytest.raises(HTTPException) as exc:
        await spotify_callback(code="test_code", state="")
    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_spotify_callback_error_response():
    with patch('Mood2FoodRecSys.Spotify_Auth.SPOTIFY_CLIENT_ID', 'client_id'), \
         patch('Mood2FoodRecSys.Spotify_Auth.SPOTIFY_CLIENT_SECRET', 'client_secret'), \
         patch('Mood2FoodRecSys.Spotify_Auth.SPOTIFY_REDIRECT_URI', 'http://localhost/callback'), \
         patch('Mood2FoodRecSys.Spotify_Auth.requests.post') as mock_post:
        
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "error": "invalid_grant",
            "error_description": "Invalid authorization code"
        }
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response
        
        from Mood2FoodRecSys.Spotify_Auth import spotify_callback
        
        with pytest.raises(HTTPException) as exc:
            await spotify_callback(code="invalid_code", state="user-123")
        assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_spotify_callback_network_error():
    with patch('Mood2FoodRecSys.Spotify_Auth.SPOTIFY_CLIENT_ID', 'client_id'), \
         patch('Mood2FoodRecSys.Spotify_Auth.SPOTIFY_CLIENT_SECRET', 'client_secret'), \
         patch('Mood2FoodRecSys.Spotify_Auth.SPOTIFY_REDIRECT_URI', 'http://localhost/callback'), \
         patch('Mood2FoodRecSys.Spotify_Auth.requests.post') as mock_post:
        
        import requests
        mock_post.side_effect = requests.RequestException("Network error")
        
        from Mood2FoodRecSys.Spotify_Auth import spotify_callback
        
        with pytest.raises(HTTPException) as exc:
            await spotify_callback(code="test_code", state="user-123")
        assert exc.value.status_code == 502


@pytest.mark.asyncio
async def test_spotify_status_connected(mock_user):
    with patch('Mood2FoodRecSys.Spotify_Auth.database') as mock_db:
        mock_db.fetch_one = AsyncMock(return_value={"user_id": "user-123"})
        
        from Mood2FoodRecSys.Spotify_Auth import spotify_status
        
        result = await spotify_status(user=mock_user)
        
        assert result["connected"] is True


@pytest.mark.asyncio
async def test_spotify_status_not_connected(mock_user):
    with patch('Mood2FoodRecSys.Spotify_Auth.database') as mock_db:
        mock_db.fetch_one = AsyncMock(return_value=None)
        
        from Mood2FoodRecSys.Spotify_Auth import spotify_status
        
        result = await spotify_status(user=mock_user)
        
        assert result["connected"] is False


@pytest.mark.asyncio
async def test_refresh_access_token_success():
    with patch('Mood2FoodRecSys.Spotify_Auth.SPOTIFY_CLIENT_ID', 'client_id'), \
         patch('Mood2FoodRecSys.Spotify_Auth.SPOTIFY_CLIENT_SECRET', 'client_secret'), \
         patch('Mood2FoodRecSys.Spotify_Auth.requests.post') as mock_post, \
         patch('Mood2FoodRecSys.Spotify_Auth.time.time', return_value=1000):
        
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "access_token": "new_access_token",
            "expires_in": 3600
        }
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response
        
        from Mood2FoodRecSys.Spotify_Auth import refresh_access_token
        
        result = await refresh_access_token(refresh_token="test_refresh")
        
        assert result["access_token"] == "new_access_token"
        assert result["expires_at"] == 4600


@pytest.mark.asyncio
async def test_refresh_access_token_missing_token():
    from Mood2FoodRecSys.Spotify_Auth import refresh_access_token
    
    with pytest.raises(HTTPException) as exc:
        await refresh_access_token(refresh_token="")
    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_refresh_access_token_error():
    with patch('Mood2FoodRecSys.Spotify_Auth.SPOTIFY_CLIENT_ID', 'client_id'), \
         patch('Mood2FoodRecSys.Spotify_Auth.SPOTIFY_CLIENT_SECRET', 'client_secret'), \
         patch('Mood2FoodRecSys.Spotify_Auth.requests.post') as mock_post:
        
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "error": "invalid_grant",
            "error_description": "Invalid refresh token"
        }
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response
        
        from Mood2FoodRecSys.Spotify_Auth import refresh_access_token
        
        with pytest.raises(HTTPException) as exc:
            await refresh_access_token(refresh_token="invalid_refresh")
        assert exc.value.status_code == 401


@pytest.mark.asyncio
async def test_spotify_callback_update_existing_tokens():
    with patch('Mood2FoodRecSys.Spotify_Auth.SPOTIFY_CLIENT_ID', 'client_id'), \
         patch('Mood2FoodRecSys.Spotify_Auth.SPOTIFY_CLIENT_SECRET', 'client_secret'), \
         patch('Mood2FoodRecSys.Spotify_Auth.SPOTIFY_REDIRECT_URI', 'http://localhost/callback'), \
         patch('Mood2FoodRecSys.Spotify_Auth.requests.post') as mock_post, \
         patch('Mood2FoodRecSys.Spotify_Auth.database') as mock_db:
        
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "access_token": "new_access",
            "refresh_token": "new_refresh",
            "expires_in": 3600
        }
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response
        
        mock_db.fetch_val = AsyncMock(return_value=1)
        mock_db.execute = AsyncMock()
        
        from Mood2FoodRecSys.Spotify_Auth import spotify_callback
        
        result = await spotify_callback(code="test_code", state="user-123")
        
        assert result.status_code == 307
        mock_db.execute.assert_called_once()
        call_args = mock_db.execute.call_args
        assert "UPDATE" in call_args[0][0]


@pytest.mark.asyncio
async def test_spotify_callback_invalid_token_response():
    with patch('Mood2FoodRecSys.Spotify_Auth.SPOTIFY_CLIENT_ID', 'client_id'), \
         patch('Mood2FoodRecSys.Spotify_Auth.SPOTIFY_CLIENT_SECRET', 'client_secret'), \
         patch('Mood2FoodRecSys.Spotify_Auth.SPOTIFY_REDIRECT_URI', 'http://localhost/callback'), \
         patch('Mood2FoodRecSys.Spotify_Auth.requests.post') as mock_post:
        
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "access_token": "test_access"
        }
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response
        
        from Mood2FoodRecSys.Spotify_Auth import spotify_callback
        
        with pytest.raises(HTTPException) as exc:
            await spotify_callback(code="test_code", state="user-123")
        assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_refresh_access_token_network_error():
    with patch('Mood2FoodRecSys.Spotify_Auth.SPOTIFY_CLIENT_ID', 'client_id'), \
         patch('Mood2FoodRecSys.Spotify_Auth.SPOTIFY_CLIENT_SECRET', 'client_secret'), \
         patch('Mood2FoodRecSys.Spotify_Auth.requests.post') as mock_post:
        
        import requests
        mock_post.side_effect = requests.RequestException("Network error")
        
        from Mood2FoodRecSys.Spotify_Auth import refresh_access_token
        
        with pytest.raises(HTTPException) as exc:
            await refresh_access_token(refresh_token="test_refresh")
        assert exc.value.status_code == 502


@pytest.mark.asyncio
async def test_spotify_status_database_error(mock_user):
    with patch('Mood2FoodRecSys.Spotify_Auth.database') as mock_db:
        mock_db.fetch_one = AsyncMock(side_effect=Exception("Database error"))
        
        from Mood2FoodRecSys.Spotify_Auth import spotify_status
        
        with pytest.raises(HTTPException) as exc:
            await spotify_status(user=mock_user)
        assert exc.value.status_code == 500
