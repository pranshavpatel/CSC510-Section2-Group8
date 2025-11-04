import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi import HTTPException
import sys
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from Mood2FoodRecSys.RecSys import get_recommendations
import asyncio


@pytest.mark.asyncio
async def test_get_recommendations_success():
    with patch('Mood2FoodRecSys.RecSys.get_user_profile_and_recent_tracks') as mock_tracks, \
         patch('Mood2FoodRecSys.RecSys.compute_time_weights') as mock_weights, \
         patch('Mood2FoodRecSys.RecSys.analyze_mood_with_groq') as mock_mood, \
         patch('Mood2FoodRecSys.RecSys.fetch_data_from_db') as mock_food, \
         patch('Mood2FoodRecSys.RecSys.fetch_preferences_from_db') as mock_prefs, \
         patch('Mood2FoodRecSys.RecSys.compute_mood_distribution') as mock_dist, \
         patch('Mood2FoodRecSys.RecSys.recommend_food_based_on_mood') as mock_rec:
        
        mock_tracks.return_value = [{"index": 1, "track_name": "test"}]
        mock_weights.return_value = [0.5, 0.5]
        mock_mood.return_value = [{"mood": ["happy"]}]
        mock_food.return_value = [{"name": "pizza", "tags": ["comfort"]}]
        mock_prefs.return_value = {"food_preferences": ["italian"]}
        mock_dist.return_value = [("happy", 0.8)]
        mock_rec.return_value = {"Suggested_food": ["pizza"]}
        
        result = await get_recommendations("user123", "rest456")
        
        assert result == {"recommended_foods": {"Suggested_food": ["pizza"]}}


@pytest.mark.asyncio
async def test_get_recommendations_missing_user_id():
    with pytest.raises(HTTPException) as exc_info:
        await get_recommendations("", "rest456")
    assert exc_info.value.status_code == 400


@pytest.mark.asyncio
async def test_get_recommendations_missing_restaurant_id():
    with pytest.raises(HTTPException) as exc_info:
        await get_recommendations("user123", "")
    assert exc_info.value.status_code == 400


@pytest.mark.asyncio
async def test_get_recommendations_no_recent_tracks():
    with patch('Mood2FoodRecSys.RecSys.get_user_profile_and_recent_tracks') as mock_tracks:
        mock_tracks.return_value = []
        
        with pytest.raises(HTTPException) as exc_info:
            await get_recommendations("user123", "rest456")
        assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_get_recommendations_no_food_items():
    with patch('Mood2FoodRecSys.RecSys.get_user_profile_and_recent_tracks') as mock_tracks, \
         patch('Mood2FoodRecSys.RecSys.compute_time_weights') as mock_weights, \
         patch('Mood2FoodRecSys.RecSys.analyze_mood_with_groq') as mock_mood, \
         patch('Mood2FoodRecSys.RecSys.fetch_data_from_db') as mock_food, \
         patch('Mood2FoodRecSys.RecSys.fetch_preferences_from_db') as mock_prefs:
        
        mock_tracks.return_value = [{"index": 1, "track_name": "test"}]
        mock_weights.return_value = [0.5]
        mock_mood.return_value = [{"mood": ["happy"]}]
        mock_food.return_value = []
        mock_prefs.return_value = {"food_preferences": []}
        
        with pytest.raises(HTTPException) as exc_info:
            await get_recommendations("user123", "rest456")
        assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_get_recommendations_internal_error():
    with patch('Mood2FoodRecSys.RecSys.get_user_profile_and_recent_tracks') as mock_tracks:
        mock_tracks.side_effect = Exception("Database error")
        
        with pytest.raises(HTTPException) as exc_info:
            await get_recommendations("user123", "rest456")
        assert exc_info.value.status_code == 500


@pytest.mark.asyncio
async def test_get_recommendations_partial_failure():
    """Test when some async operations fail"""
    with patch('Mood2FoodRecSys.RecSys.get_user_profile_and_recent_tracks') as mock_tracks, \
         patch('Mood2FoodRecSys.RecSys.compute_time_weights') as mock_weights, \
         patch('Mood2FoodRecSys.RecSys.analyze_mood_with_groq') as mock_mood, \
         patch('Mood2FoodRecSys.RecSys.fetch_data_from_db') as mock_food, \
         patch('Mood2FoodRecSys.RecSys.fetch_preferences_from_db') as mock_prefs:
        
        mock_tracks.return_value = [{"index": 1, "track_name": "test"}]
        mock_weights.return_value = [0.5]
        mock_mood.side_effect = HTTPException(status_code=500, detail="Groq API failed")
        mock_food.return_value = [{"name": "pizza"}]
        mock_prefs.return_value = {"food_preferences": []}
        
        with pytest.raises(HTTPException) as exc_info:
            await get_recommendations("user123", "rest456")
        assert exc_info.value.status_code == 500


@pytest.mark.asyncio
async def test_get_recommendations_empty_mood_distribution():
    """Test when mood distribution is empty"""
    with patch('Mood2FoodRecSys.RecSys.get_user_profile_and_recent_tracks') as mock_tracks, \
         patch('Mood2FoodRecSys.RecSys.compute_time_weights') as mock_weights, \
         patch('Mood2FoodRecSys.RecSys.analyze_mood_with_groq') as mock_mood, \
         patch('Mood2FoodRecSys.RecSys.fetch_data_from_db') as mock_food, \
         patch('Mood2FoodRecSys.RecSys.fetch_preferences_from_db') as mock_prefs, \
         patch('Mood2FoodRecSys.RecSys.compute_mood_distribution') as mock_dist, \
         patch('Mood2FoodRecSys.RecSys.recommend_food_based_on_mood') as mock_rec:
        
        mock_tracks.return_value = [{"index": 1, "track_name": "test"}]
        mock_weights.return_value = [0.5]
        mock_mood.return_value = []
        mock_food.return_value = [{"name": "pizza"}]
        mock_prefs.return_value = {"food_preferences": []}
        mock_dist.return_value = []
        mock_rec.return_value = {"Suggested_food": []}
        
        result = await get_recommendations("user123", "rest456")
        assert result == {"recommended_foods": {"Suggested_food": []}}


@pytest.mark.asyncio
async def test_get_recommendations_malformed_user_id():
    """Test with various malformed user IDs"""
    test_cases = [None, "", "   ", "\n", "\t"]
    
    for user_id in test_cases:
        with pytest.raises(HTTPException) as exc_info:
            await get_recommendations(user_id, "rest456")
        assert exc_info.value.status_code in [400, 500]  # Can be either validation or internal error


@pytest.mark.asyncio
async def test_get_recommendations_large_dataset():
    """Test with large number of tracks and food items"""
    with patch('Mood2FoodRecSys.RecSys.get_user_profile_and_recent_tracks') as mock_tracks, \
         patch('Mood2FoodRecSys.RecSys.compute_time_weights') as mock_weights, \
         patch('Mood2FoodRecSys.RecSys.analyze_mood_with_groq') as mock_mood, \
         patch('Mood2FoodRecSys.RecSys.fetch_data_from_db') as mock_food, \
         patch('Mood2FoodRecSys.RecSys.fetch_preferences_from_db') as mock_prefs, \
         patch('Mood2FoodRecSys.RecSys.compute_mood_distribution') as mock_dist, \
         patch('Mood2FoodRecSys.RecSys.recommend_food_based_on_mood') as mock_rec:
        
        # Large dataset simulation
        large_tracks = [{"index": i, "track_name": f"track_{i}"} for i in range(100)]
        large_food_items = [{"name": f"food_{i}", "tags": ["tag1"]} for i in range(500)]
        
        mock_tracks.return_value = large_tracks
        mock_weights.return_value = [0.01] * 100
        mock_mood.return_value = [{"mood": ["happy"]} for _ in range(100)]
        mock_food.return_value = large_food_items
        mock_prefs.return_value = {"food_preferences": ["tag1"]}
        mock_dist.return_value = [("happy", 1.0)]
        mock_rec.return_value = {"Suggested_food": ["food_1", "food_2"]}
        
        result = await get_recommendations("user123", "rest456")
        assert "recommended_foods" in result