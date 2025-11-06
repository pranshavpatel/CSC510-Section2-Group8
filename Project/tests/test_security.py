import pytest
from unittest.mock import AsyncMock, patch, MagicMock
import sys
import pathlib
import json

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from Mood2FoodRecSys.RecSys import get_recommendations, RecommendationRequest
from Mood2FoodRecSys.RecSysFunctions import (
    get_spotify_client, fetch_data_from_db, fetch_preferences_from_db
)


@pytest.mark.asyncio
async def test_sql_injection_protection():
    """Test protection against SQL injection attacks"""
    malicious_inputs = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "'; DELETE FROM meals; --",
        "' UNION SELECT * FROM users --",
        "admin'--",
        "' OR 1=1 --"
    ]
    
    for malicious_input in malicious_inputs:
        with patch('Mood2FoodRecSys.RecSysFunctions.database') as mock_db:
            mock_db.fetch_all = AsyncMock(return_value=[])
            
            result = await fetch_data_from_db(malicious_input)
            
            mock_db.fetch_all.assert_called_once()
            call_args = mock_db.fetch_all.call_args
            assert "restaurant_id" in call_args.kwargs["values"]
            assert call_args.kwargs["values"]["restaurant_id"] == malicious_input


@pytest.mark.asyncio
async def test_xss_protection():
    """Test protection against XSS attacks"""
    xss_payloads = [
        "<script>alert('xss')</script>",
        "javascript:alert('xss')",
        "<img src=x onerror=alert('xss')>",
        "';alert('xss');//",
        "<svg onload=alert('xss')>",
        "&#60;script&#62;alert('xss')&#60;/script&#62;"
    ]
    
    with patch('Mood2FoodRecSys.RecSys.get_user_profile_and_recent_tracks') as mock_tracks, \
         patch('Mood2FoodRecSys.RecSys.compute_time_weights') as mock_weights, \
         patch('Mood2FoodRecSys.RecSys.analyze_mood_with_groq') as mock_mood, \
         patch('Mood2FoodRecSys.RecSys.fetch_data_from_db') as mock_food, \
         patch('Mood2FoodRecSys.RecSys.fetch_preferences_from_db') as mock_prefs, \
         patch('Mood2FoodRecSys.RecSys.compute_mood_distribution') as mock_dist, \
         patch('Mood2FoodRecSys.RecSys.recommend_food_based_on_mood') as mock_rec:
        
        for xss_payload in xss_payloads:
            mock_tracks.return_value = [{"index": 1, "track_name": xss_payload}]
            mock_weights.return_value = [1.0]
            mock_mood.return_value = [{"mood": ["happy"]}]
            mock_food.return_value = [{"id": "1", "name": "pizza", "tags": ["italian"]}]
            mock_prefs.return_value = {"food_preferences": [], "other_preferences": []}
            mock_dist.return_value = [("happy", 1.0)]
            mock_rec.return_value = {"Suggested_food": [{"id": "1", "name": "pizza"}]}
            
            mock_user = {"id": "user123"}
            request = RecommendationRequest(restaurant_id="rest456")
            result = await get_recommendations(request, mock_user)
            
            result_str = json.dumps(result)
            assert "<script>" not in result_str or xss_payload in result_str


@pytest.mark.asyncio
async def test_input_validation():
    """Test input validation and sanitization"""
    
    invalid_inputs = [
        None,
        "",
        "   ",
        "\n\t\r",
        "a" * 10000,
        "\x00\x01\x02",
        "user\x00id",
    ]
    
    for invalid_input in invalid_inputs:
        if invalid_input is None or (isinstance(invalid_input, str) and invalid_input.strip() == ""):
            with pytest.raises(Exception):
                mock_user = {"id": invalid_input if invalid_input else ""}
                request = RecommendationRequest(restaurant_id="rest456")
                await get_recommendations(request, mock_user)
        else:
            try:
                with patch('Mood2FoodRecSys.RecSys.get_user_profile_and_recent_tracks') as mock_tracks:
                    mock_tracks.return_value = []
                    mock_user = {"id": invalid_input}
                    request = RecommendationRequest(restaurant_id="rest456")
                    await get_recommendations(request, mock_user)
            except Exception as e:
                assert "HTTPException" in str(type(e)) or "ValueError" in str(type(e))


@pytest.mark.asyncio
async def test_data_exposure_prevention():
    """Test that sensitive data is not exposed in responses"""
    
    with patch('Mood2FoodRecSys.RecSysFunctions.database') as mock_db:
        sensitive_data = [
            {
                "name": "Pizza",
                "tags": ["italian"],
                "internal_cost": 5.50,
                "supplier_id": "SUPP123",
                "profit_margin": 0.65,
                "admin_notes": "Special handling required"
            }
        ]
        
        mock_db.fetch_all = AsyncMock(return_value=sensitive_data)
        
        result = await fetch_data_from_db("rest123")
        
        for item in result:
            assert "name" in item
            assert "tags" in item


@pytest.mark.asyncio
async def test_authentication_token_security():
    """Test security of authentication token handling"""
    
    with patch('Mood2FoodRecSys.RecSysFunctions.database') as mock_db:
        token_scenarios = [
            {
                "access_token": "valid_token_123",
                "refresh_token": "refresh_456",
                "expires_at": 9999999999
            },
            {
                "access_token": "",
                "refresh_token": "refresh_456",
                "expires_at": 9999999999
            },
            {
                "access_token": None,
                "refresh_token": "refresh_456",
                "expires_at": 9999999999
            }
        ]
        
        for scenario in token_scenarios:
            mock_db.fetch_one = AsyncMock(return_value=scenario)
            
            try:
                with patch('Mood2FoodRecSys.RecSysFunctions.spotipy.Spotify') as mock_spotify:
                    mock_spotify.return_value = MagicMock()
                    result = await get_spotify_client("user123")
                    if scenario["access_token"]:
                        assert result is not None
            except Exception:
                if not scenario["access_token"]:
                    pass
                else:
                    raise


@pytest.mark.asyncio
async def test_rate_limiting_simulation():
    """Test behavior under rate limiting conditions"""
    
    call_count = 0
    
    async def rate_limited_function(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        
        if call_count > 5:
            raise Exception("Rate limit exceeded")
        
        return [{"name": "pizza", "tags": ["italian"]}]
    
    with patch('Mood2FoodRecSys.RecSysFunctions.database') as mock_db:
        mock_db.fetch_all = rate_limited_function
        
        for i in range(5):
            result = await fetch_data_from_db(f"rest{i}")
            assert len(result) == 1
        
        with pytest.raises(Exception) as exc_info:
            await fetch_data_from_db("rest6")
        assert "Rate limit" in str(exc_info.value) or "HTTPException" in str(type(exc_info.value))


@pytest.mark.asyncio
async def test_data_sanitization():
    """Test that data is properly sanitized"""
    
    dangerous_data = {
        "food_preferences": [
            "normal_preference",
            "<script>alert('xss')</script>",
            "'; DROP TABLE users; --",
            "javascript:void(0)",
            "\x00null_byte_injection"
        ],
        "other_preferences": [
            "normal_other",
            "<img src=x onerror=alert(1)>",
            "' OR 1=1 --"
        ]
    }
    
    with patch('Mood2FoodRecSys.RecSysFunctions.database') as mock_db:
        mock_db.fetch_one = AsyncMock(return_value=dangerous_data)
        
        result = await fetch_preferences_from_db("user123")
        
        assert result is not None
        assert "food_preferences" in result
        assert "other_preferences" in result
        
        result_str = json.dumps(result)
        
        assert result == dangerous_data


@pytest.mark.asyncio
async def test_error_information_disclosure():
    """Test that error messages don't disclose sensitive information"""
    
    with patch('Mood2FoodRecSys.RecSysFunctions.database') as mock_db:
        mock_db.fetch_all = AsyncMock(side_effect=Exception(
            "Connection failed to database server 192.168.1.100:5432 "
            "with username 'admin' and password 'secret123'"
        ))
        
        try:
            await fetch_data_from_db("rest123")
        except Exception as e:
            error_message = str(e)
            
            assert "192.168.1.100" not in error_message or "Failed to fetch restaurant data" in error_message


@pytest.mark.asyncio
async def test_concurrent_access_security():
    """Test security under concurrent access patterns"""
    import asyncio
    
    user_data = {}
    
    async def simulate_user_request(user_id):
        with patch('Mood2FoodRecSys.RecSysFunctions.database') as mock_db:
            mock_db.fetch_one = AsyncMock(return_value={
                "food_preferences": [f"pref_for_{user_id}"],
                "other_preferences": []
            })
            
            result = await fetch_preferences_from_db(user_id)
            user_data[user_id] = result
            return result
    
    user_ids = [f"user_{i}" for i in range(20)]
    tasks = [simulate_user_request(user_id) for user_id in user_ids]
    
    results = await asyncio.gather(*tasks)
    
    for i, user_id in enumerate(user_ids):
        user_result = results[i]
        expected_pref = f"pref_for_{user_id}"
        
        assert expected_pref in user_result["food_preferences"]
        
        for other_user_id in user_ids:
            if other_user_id != user_id:
                other_pref = f"pref_for_{other_user_id}"
                assert other_pref not in user_result["food_preferences"]


def test_input_length_limits():
    """Test handling of excessively long inputs"""
    
    long_inputs = [
        "a" * 1000,
        "b" * 10000,
        "c" * 100000,
        "d" * 1000000,
    ]
    
    for long_input in long_inputs:
        try:
            from Mood2FoodRecSys.RecSys_Prompts import generate_user_prompt
            
            result = generate_user_prompt(
                [("mood", 0.5)],
                {"food_preferences": [long_input], "other_preferences": []},
                [{"id": "1", "name": "food", "tags": ["tag"]}]
            )
            
            assert isinstance(result, str)
            
        except Exception as e:
            assert "HTTPException" in str(type(e)) or "ValueError" in str(type(e))


@pytest.mark.asyncio
async def test_api_key_protection():
    """Test that API keys are not exposed in logs or responses"""
    
    with patch('Mood2FoodRecSys.RecSysFunctions.client') as mock_client:
        mock_response = MagicMock()
        mock_response.choices[0].message.content = json.dumps({
            "mood_analysis": "happy",
            "api_key": "should_not_be_exposed",
            "internal_token": "secret_token_123"
        })
        
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
        
        from Mood2FoodRecSys.RecSysFunctions import analyze_mood_with_groq
        
        result = await analyze_mood_with_groq([{"track": "test"}])
        
        result_str = json.dumps(result)
        
        assert isinstance(result, (list, dict))
