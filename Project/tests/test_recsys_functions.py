import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi import HTTPException
import numpy as np
import json
import sys
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from Mood2FoodRecSys.RecSysFunctions import (
    get_spotify_client, get_user_profile_and_recent_tracks, compute_time_weights,
    analyze_mood_with_groq, compute_mood_distribution, recommend_food_based_on_mood,
    fetch_data_from_db, fetch_preferences_from_db
)
import spotipy
import requests
import asyncio


@pytest.mark.asyncio
async def test_get_spotify_client_success():
    mock_db_response = {
        "access_token": "valid_token",
        "refresh_token": "refresh_token",
        "expires_at": 9999999999
    }
    
    with patch('Mood2FoodRecSys.RecSysFunctions.database') as mock_db, \
         patch('Mood2FoodRecSys.RecSysFunctions.spotipy.Spotify') as mock_spotify:
        
        mock_db.fetch_one = AsyncMock(return_value=mock_db_response)
        mock_spotify_instance = MagicMock()
        mock_spotify.return_value = mock_spotify_instance
        
        result = await get_spotify_client("user123")
        assert result == mock_spotify_instance


@pytest.mark.asyncio
async def test_get_spotify_client_missing_user():
    with pytest.raises(HTTPException) as exc_info:
        await get_spotify_client("")
    assert exc_info.value.status_code == 500


@pytest.mark.asyncio
async def test_get_spotify_client_no_auth_found():
    with patch('Mood2FoodRecSys.RecSysFunctions.database') as mock_db:
        mock_db.fetch_one = AsyncMock(return_value=None)
        
        with pytest.raises(HTTPException) as exc_info:
            await get_spotify_client("user123")
        assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_get_user_profile_and_recent_tracks_success():
    mock_tracks_data = {
        "items": [{
            "track": {
                "name": "Test Song",
                "artists": [{"name": "Test Artist"}]
            },
            "played_at": "2023-01-01T12:00:00Z"
        }]
    }
    
    with patch('Mood2FoodRecSys.RecSysFunctions.get_spotify_client') as mock_client:
        mock_sp = MagicMock()
        mock_sp.current_user_recently_played.return_value = mock_tracks_data
        mock_client.return_value = mock_sp
        
        result = await get_user_profile_and_recent_tracks("user123")
        assert len(result) == 1
        assert result[0]["track_name"] == "Test Song"


@pytest.mark.asyncio
async def test_get_user_profile_and_recent_tracks_empty():
    with patch('Mood2FoodRecSys.RecSysFunctions.get_spotify_client') as mock_client:
        mock_sp = MagicMock()
        mock_sp.current_user_recently_played.return_value = {"items": []}
        mock_client.return_value = mock_sp
        
        result = await get_user_profile_and_recent_tracks("user123")
        assert result == []


def test_compute_time_weights_success():
    items = [
        {"index": 1, "time_stamp": 1000},
        {"index": 2, "time_stamp": 1060}
    ]
    
    weights = compute_time_weights(items)
    assert len(weights) == 2
    assert np.sum(weights) == pytest.approx(1.0)


def test_compute_time_weights_empty():
    result = compute_time_weights([])
    assert len(result) == 0


@pytest.mark.asyncio
async def test_analyze_mood_with_groq_success():
    mock_response = MagicMock()
    mock_response.choices[0].message.content = '[{"mood": ["happy"]}]'
    
    with patch('Mood2FoodRecSys.RecSysFunctions.client') as mock_client:
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
        
        result = await analyze_mood_with_groq([{"track": "test"}])
        assert result == [{"mood": ["happy"]}]


@pytest.mark.asyncio
async def test_analyze_mood_with_groq_empty_input():
    result = await analyze_mood_with_groq([])
    assert result == []


@pytest.mark.asyncio
async def test_analyze_mood_with_groq_invalid_json():
    mock_response = MagicMock()
    mock_response.choices[0].message.content = 'invalid json'
    
    with patch('Mood2FoodRecSys.RecSysFunctions.client') as mock_client:
        mock_client.chat.completions.create.return_value = mock_response
        
        with pytest.raises(HTTPException) as exc_info:
            await analyze_mood_with_groq([{"track": "test"}])
        assert exc_info.value.status_code == 500


def test_compute_mood_distribution_success():
    response_json = [{"mood": ["happy", "energetic"]}]
    weights = np.array([1.0])
    
    result = compute_mood_distribution(response_json, weights)
    assert len(result) == 2
    assert result[0][0] in ["happy", "energetic"]


def test_compute_mood_distribution_empty():
    result = compute_mood_distribution([], np.array([]))
    assert result == []


@pytest.mark.asyncio
async def test_recommend_food_based_on_mood_success():
    mock_response = MagicMock()
    mock_response.choices[0].message.content = '{"Suggested_food": ["pizza"]}'
    
    with patch('Mood2FoodRecSys.RecSysFunctions.client') as mock_client, \
         patch('Mood2FoodRecSys.RecSysFunctions.generate_user_prompt') as mock_prompt:
        
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
        mock_prompt.return_value = "test prompt"
        
        result = await recommend_food_based_on_mood([("happy", 0.8)], {}, [{"name": "pizza"}])
        assert result == {"Suggested_food": ["pizza"]}


@pytest.mark.asyncio
async def test_recommend_food_based_on_mood_empty():
    result = await recommend_food_based_on_mood([], {}, [])
    assert result == {"Suggested_food": []}


@pytest.mark.asyncio
async def test_fetch_data_from_db_success():
    mock_response = [{"name": "pizza", "tags": ["italian"]}]
    
    with patch('Mood2FoodRecSys.RecSysFunctions.database') as mock_db:
        mock_db.fetch_all = AsyncMock(return_value=mock_response)
        
        result = await fetch_data_from_db("rest123")
        assert result == mock_response


@pytest.mark.asyncio
async def test_fetch_data_from_db_missing_id():
    with pytest.raises(HTTPException) as exc_info:
        await fetch_data_from_db("")
    assert exc_info.value.status_code == 500


@pytest.mark.asyncio
async def test_fetch_preferences_from_db_success():
    mock_response = {"food_preferences": ["italian"], "other_preferences": []}
    
    with patch('Mood2FoodRecSys.RecSysFunctions.database') as mock_db:
        mock_db.fetch_one = AsyncMock(return_value=mock_response)
        
        result = await fetch_preferences_from_db("user123")
        assert result == mock_response


@pytest.mark.asyncio
async def test_fetch_preferences_from_db_not_found():
    with patch('Mood2FoodRecSys.RecSysFunctions.database') as mock_db:
        mock_db.fetch_one = AsyncMock(return_value=None)
        
        result = await fetch_preferences_from_db("user123")
        assert result == {"food_preferences": [], "other_preferences": []}


@pytest.mark.asyncio
async def test_get_spotify_client_token_refresh_success():
    """Test successful token refresh when expired"""
    mock_db_response = {
        "access_token": "expired_token",
        "refresh_token": "valid_refresh",
        "expires_at": 1000  # Expired
    }
    
    with patch('Mood2FoodRecSys.RecSysFunctions.database') as mock_db, \
         patch('Mood2FoodRecSys.RecSysFunctions.spotipy.Spotify') as mock_spotify, \
         patch('Mood2FoodRecSys.RecSysFunctions.requests.post') as mock_post, \
         patch('Mood2FoodRecSys.RecSysFunctions.time.time', return_value=2000):
        
        mock_db.fetch_one = AsyncMock(return_value=mock_db_response)
        mock_db.execute = AsyncMock()
        
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "access_token": "new_token",
            "expires_in": 3600
        }
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response
        
        mock_spotify_instance = MagicMock()
        mock_spotify.return_value = mock_spotify_instance
        
        result = await get_spotify_client("user123")
        assert result == mock_spotify_instance
        mock_post.assert_called_once()


@pytest.mark.asyncio
async def test_get_spotify_client_refresh_network_error():
    """Test network error during token refresh"""
    mock_db_response = {
        "access_token": "expired_token",
        "refresh_token": "valid_refresh",
        "expires_at": 1000
    }
    
    with patch('Mood2FoodRecSys.RecSysFunctions.database') as mock_db, \
         patch('Mood2FoodRecSys.RecSysFunctions.requests.post') as mock_post, \
         patch('Mood2FoodRecSys.RecSysFunctions.time.time', return_value=2000):
        
        mock_db.fetch_one = AsyncMock(return_value=mock_db_response)
        mock_post.side_effect = requests.RequestException("Network error")
        
        with pytest.raises(HTTPException) as exc_info:
            await get_spotify_client("user123")
        assert exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_get_user_profile_spotify_exception():
    """Test Spotify API exception handling"""
    with patch('Mood2FoodRecSys.RecSysFunctions.get_spotify_client') as mock_client:
        mock_sp = MagicMock()
        mock_sp.current_user_recently_played.side_effect = spotipy.SpotifyException(401, -1, "Unauthorized")
        mock_client.return_value = mock_sp
        
        with pytest.raises(HTTPException) as exc_info:
            await get_user_profile_and_recent_tracks("user123")
        assert exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_get_user_profile_malformed_track_data():
    """Test handling of malformed track data"""
    mock_tracks_data = {
        "items": [
            {
                "track": {
                    "name": "Valid Song",
                    "artists": [{"name": "Valid Artist"}]
                },
                "played_at": "2023-01-01T12:00:00Z"
            },
            {
                "track": {
                    "name": "Invalid Song"
                    # Missing artists
                },
                "played_at": "2023-01-01T12:05:00Z"
            },
            {
                # Missing track entirely
                "played_at": "invalid-date"
            }
        ]
    }
    
    with patch('Mood2FoodRecSys.RecSysFunctions.get_spotify_client') as mock_client:
        mock_sp = MagicMock()
        mock_sp.current_user_recently_played.return_value = mock_tracks_data
        mock_client.return_value = mock_sp
        
        result = await get_user_profile_and_recent_tracks("user123")
        assert len(result) == 1  # Only valid track should be returned
        assert result[0]["track_name"] == "Valid Song"


def test_compute_time_weights_edge_cases():
    """Test time weight computation with edge cases"""
    # Test with identical timestamps
    items = [
        {"index": 1, "time_stamp": 1000},
        {"index": 2, "time_stamp": 1000}
    ]
    weights = compute_time_weights(items)
    assert len(weights) == 2
    assert abs(weights[0] - 0.5) < 0.01
    
    # Test with single item
    single_item = [{"index": 1, "time_stamp": 1000}]
    weights = compute_time_weights(single_item)
    assert len(weights) == 1
    assert weights[0] == 1.0


@pytest.mark.asyncio
async def test_analyze_mood_groq_timeout():
    """Test Groq API timeout handling"""
    with patch('Mood2FoodRecSys.RecSysFunctions.client') as mock_client:
        mock_client.chat.completions.create = AsyncMock(side_effect=asyncio.TimeoutError())
        
        with pytest.raises(HTTPException) as exc_info:
            await analyze_mood_with_groq([{"track": "test"}])
        assert exc_info.value.status_code == 500


@pytest.mark.asyncio
async def test_analyze_mood_empty_response():
    """Test empty response from Groq API"""
    mock_response = MagicMock()
    mock_response.choices[0].message.content = ""
    
    with patch('Mood2FoodRecSys.RecSysFunctions.client') as mock_client:
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
        
        with pytest.raises(HTTPException) as exc_info:
            await analyze_mood_with_groq([{"track": "test"}])
        assert exc_info.value.status_code == 500


def test_compute_mood_distribution_malformed_data():
    """Test mood distribution with malformed data"""
    # Test with missing mood field
    response_json = [{"track": "test"}]  # No mood field
    weights = np.array([1.0])
    
    result = compute_mood_distribution(response_json, weights)
    assert result == []
    
    # Test with non-list mood
    response_json = [{"mood": "happy"}]  # String instead of list
    result = compute_mood_distribution(response_json, weights)
    assert result == []
    
    # Test with mixed valid/invalid data
    response_json = [
        {"mood": ["happy", "energetic"]},
        {"mood": "invalid"},
        {"track": "no_mood"}
    ]
    weights = np.array([0.5, 0.3, 0.2])
    result = compute_mood_distribution(response_json, weights)
    assert len(result) == 2  # Only valid moods


@pytest.mark.asyncio
async def test_recommend_food_rate_limiting():
    """Test handling of API rate limiting"""
    with patch('Mood2FoodRecSys.RecSysFunctions.client') as mock_client:
        mock_client.chat.completions.create = AsyncMock(side_effect=Exception("Rate limit exceeded"))
        
        with pytest.raises(HTTPException) as exc_info:
            await recommend_food_based_on_mood([("happy", 0.8)], {}, [{"name": "pizza"}])
        assert exc_info.value.status_code == 500


@pytest.mark.asyncio
async def test_database_connection_failure():
    """Test database connection failures"""
    with patch('Mood2FoodRecSys.RecSysFunctions.database') as mock_db:
        mock_db.fetch_all = AsyncMock(side_effect=Exception("Connection failed"))
        
        with pytest.raises(HTTPException) as exc_info:
            await fetch_data_from_db("rest123")
        assert exc_info.value.status_code == 500


@pytest.mark.asyncio
async def test_concurrent_requests():
    """Test handling of concurrent requests"""
    mock_response = [{"name": "pizza", "tags": ["italian"]}]
    
    with patch('Mood2FoodRecSys.RecSysFunctions.database') as mock_db:
        mock_db.fetch_all = AsyncMock(return_value=mock_response)
        
        # Simulate concurrent requests
        tasks = [fetch_data_from_db(f"rest{i}") for i in range(10)]
        results = await asyncio.gather(*tasks)
        
        assert len(results) == 10
        assert all(result == mock_response for result in results)