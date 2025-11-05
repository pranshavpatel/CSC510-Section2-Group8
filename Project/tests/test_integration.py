import pytest
from unittest.mock import AsyncMock, patch, MagicMock
import asyncio
import sys
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from Mood2FoodRecSys.RecSys import get_recommendations


@pytest.mark.asyncio
async def test_full_integration_flow():
    """Test complete end-to-end flow"""
    with patch('Mood2FoodRecSys.RecSys.get_user_profile_and_recent_tracks') as mock_tracks, \
         patch('Mood2FoodRecSys.RecSys.compute_time_weights') as mock_weights, \
         patch('Mood2FoodRecSys.RecSys.analyze_mood_with_groq') as mock_mood, \
         patch('Mood2FoodRecSys.RecSys.fetch_data_from_db') as mock_food, \
         patch('Mood2FoodRecSys.RecSys.fetch_preferences_from_db') as mock_prefs, \
         patch('Mood2FoodRecSys.RecSys.compute_mood_distribution') as mock_dist, \
         patch('Mood2FoodRecSys.RecSys.recommend_food_based_on_mood') as mock_rec:
        
        # Realistic data simulation
        mock_tracks.return_value = [
            {"index": 1, "track_name": "Happy Song", "artists": "Artist1", "time_stamp": 1000},
            {"index": 2, "track_name": "Energetic Beat", "artists": "Artist2", "time_stamp": 1060}
        ]
        mock_weights.return_value = [0.6, 0.4]
        mock_mood.return_value = [
            {"mood": ["happy", "upbeat"]},
            {"mood": ["energetic", "excited"]}
        ]
        mock_food.return_value = [
            {"name": "Spicy Pizza", "tags": ["spicy", "comfort", "italian"]},
            {"name": "Fresh Salad", "tags": ["healthy", "fresh", "light"]},
            {"name": "Energy Bar", "tags": ["energetic", "healthy", "quick"]}
        ]
        mock_prefs.return_value = {
            "food_preferences": ["spicy", "italian"],
            "other_preferences": ["quick", "comfort"]
        }
        mock_dist.return_value = [("happy", 0.4), ("energetic", 0.3), ("upbeat", 0.2), ("excited", 0.1)]
        mock_rec.return_value = {
            "Suggested_food": ["Spicy Pizza", "Energy Bar"]
        }
        
        result = await get_recommendations("user123", "rest456")
        
        assert result["recommended_foods"]["Suggested_food"] == ["Spicy Pizza", "Energy Bar"]
        
        # Verify all functions were called with correct parameters
        mock_tracks.assert_called_once_with(user_id="user123")
        mock_weights.assert_called_once()
        mock_mood.assert_called_once()
        mock_food.assert_called_once_with(restaurant_id="rest456")
        mock_prefs.assert_called_once_with(user_id="user123")


@pytest.mark.asyncio
async def test_integration_with_api_failures():
    """Test integration when external APIs fail"""
    failure_scenarios = [
        ("tracks", "get_user_profile_and_recent_tracks"),
        ("mood", "analyze_mood_with_groq"),
        ("food", "fetch_data_from_db"),
        ("prefs", "fetch_preferences_from_db")
    ]
    
    for scenario_name, failing_function in failure_scenarios:
        with patch('Mood2FoodRecSys.RecSys.get_user_profile_and_recent_tracks') as mock_tracks, \
             patch('Mood2FoodRecSys.RecSys.analyze_mood_with_groq') as mock_mood, \
             patch('Mood2FoodRecSys.RecSys.fetch_data_from_db') as mock_food, \
             patch('Mood2FoodRecSys.RecSys.fetch_preferences_from_db') as mock_prefs:
            
            # Set up successful responses for all except the failing one
            mock_tracks.return_value = [{"index": 1, "track_name": "test"}]
            mock_mood.return_value = [{"mood": ["happy"]}]
            mock_food.return_value = [{"name": "pizza", "tags": ["italian"]}]
            mock_prefs.return_value = {"food_preferences": [], "other_preferences": []}
            
            # Make one function fail
            if failing_function == "get_user_profile_and_recent_tracks":
                mock_tracks.side_effect = Exception(f"{scenario_name} API failed")
            elif failing_function == "analyze_mood_with_groq":
                mock_mood.side_effect = Exception(f"{scenario_name} API failed")
            elif failing_function == "fetch_data_from_db":
                mock_food.side_effect = Exception(f"{scenario_name} API failed")
            elif failing_function == "fetch_preferences_from_db":
                mock_prefs.side_effect = Exception(f"{scenario_name} API failed")
            
            with pytest.raises(Exception):
                await get_recommendations("user123", "rest456")


@pytest.mark.asyncio
async def test_integration_performance_stress():
    """Test system under stress conditions"""
    with patch('Mood2FoodRecSys.RecSys.get_user_profile_and_recent_tracks') as mock_tracks, \
         patch('Mood2FoodRecSys.RecSys.compute_time_weights') as mock_weights, \
         patch('Mood2FoodRecSys.RecSys.analyze_mood_with_groq') as mock_mood, \
         patch('Mood2FoodRecSys.RecSys.fetch_data_from_db') as mock_food, \
         patch('Mood2FoodRecSys.RecSys.fetch_preferences_from_db') as mock_prefs, \
         patch('Mood2FoodRecSys.RecSys.compute_mood_distribution') as mock_dist, \
         patch('Mood2FoodRecSys.RecSys.recommend_food_based_on_mood') as mock_rec:
        
        # Simulate heavy load
        mock_tracks.return_value = [{"index": i, "track_name": f"track_{i}"} for i in range(50)]
        mock_weights.return_value = [0.02] * 50
        mock_mood.return_value = [{"mood": ["happy", "energetic"]} for _ in range(50)]
        mock_food.return_value = [{"name": f"food_{i}", "tags": ["tag1", "tag2"]} for i in range(1000)]
        mock_prefs.return_value = {
            "food_preferences": [f"pref_{i}" for i in range(20)],
            "other_preferences": [f"other_{i}" for i in range(10)]
        }
        mock_dist.return_value = [("happy", 0.6), ("energetic", 0.4)]
        mock_rec.return_value = {"Suggested_food": [f"food_{i}" for i in range(10)]}
        
        # Test multiple concurrent requests
        start_time = asyncio.get_event_loop().time()
        tasks = [get_recommendations(f"user_{i}", f"rest_{i}") for i in range(20)]
        results = await asyncio.gather(*tasks)
        end_time = asyncio.get_event_loop().time()
        
        assert len(results) == 20
        assert all("recommended_foods" in result for result in results)
        assert (end_time - start_time) < 10  # Should complete within 10 seconds


@pytest.mark.asyncio
async def test_integration_data_consistency():
    """Test data consistency across the pipeline"""
    with patch('Mood2FoodRecSys.RecSys.get_user_profile_and_recent_tracks') as mock_tracks, \
         patch('Mood2FoodRecSys.RecSys.compute_time_weights') as mock_weights, \
         patch('Mood2FoodRecSys.RecSys.analyze_mood_with_groq') as mock_mood, \
         patch('Mood2FoodRecSys.RecSys.fetch_data_from_db') as mock_food, \
         patch('Mood2FoodRecSys.RecSys.fetch_preferences_from_db') as mock_prefs, \
         patch('Mood2FoodRecSys.RecSys.compute_mood_distribution') as mock_dist, \
         patch('Mood2FoodRecSys.RecSys.recommend_food_based_on_mood') as mock_rec:
        
        # Test with consistent data
        tracks_data = [
            {"index": 1, "track_name": "Happy Song", "time_stamp": 1000},
            {"index": 2, "track_name": "Sad Song", "time_stamp": 1060}
        ]
        
        mock_tracks.return_value = tracks_data
        mock_weights.return_value = [0.6, 0.4]
        mock_mood.return_value = [
            {"mood": ["happy"]},
            {"mood": ["sad"]}
        ]
        mock_food.return_value = [
            {"name": "Comfort Food", "tags": ["comfort", "warm"]},
            {"name": "Light Snack", "tags": ["light", "healthy"]}
        ]
        mock_prefs.return_value = {
            "food_preferences": ["comfort"],
            "other_preferences": ["warm"]
        }
        mock_dist.return_value = [("happy", 0.6), ("sad", 0.4)]
        mock_rec.return_value = {"Suggested_food": ["Comfort Food"]}
        
        result = await get_recommendations("user123", "rest456")
        
        # Verify data flows correctly through the pipeline
        assert mock_weights.call_args[0][0] == tracks_data
        assert mock_mood.call_args[0][0] == tracks_data
        assert result["recommended_foods"]["Suggested_food"] == ["Comfort Food"]


@pytest.mark.asyncio
async def test_integration_error_recovery():
    """Test system recovery from transient errors"""
    call_count = 0
    
    def failing_then_succeeding(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        if call_count <= 2:
            raise Exception("Transient error")
        return [{"index": 1, "track_name": "test"}]
    
    with patch('Mood2FoodRecSys.RecSys.get_user_profile_and_recent_tracks', side_effect=failing_then_succeeding), \
         patch('Mood2FoodRecSys.RecSys.compute_time_weights') as mock_weights, \
         patch('Mood2FoodRecSys.RecSys.analyze_mood_with_groq') as mock_mood, \
         patch('Mood2FoodRecSys.RecSys.fetch_data_from_db') as mock_food, \
         patch('Mood2FoodRecSys.RecSys.fetch_preferences_from_db') as mock_prefs, \
         patch('Mood2FoodRecSys.RecSys.compute_mood_distribution') as mock_dist, \
         patch('Mood2FoodRecSys.RecSys.recommend_food_based_on_mood') as mock_rec:
        
        mock_weights.return_value = [1.0]
        mock_mood.return_value = [{"mood": ["happy"]}]
        mock_food.return_value = [{"name": "pizza", "tags": ["italian"]}]
        mock_prefs.return_value = {"food_preferences": [], "other_preferences": []}
        mock_dist.return_value = [("happy", 1.0)]
        mock_rec.return_value = {"Suggested_food": ["pizza"]}
        
        # First two calls should fail
        with pytest.raises(Exception):
            await get_recommendations("user123", "rest456")
        
        with pytest.raises(Exception):
            await get_recommendations("user123", "rest456")
        
        # Third call should succeed
        result = await get_recommendations("user123", "rest456")
        assert result["recommended_foods"]["Suggested_food"] == ["pizza"]


@pytest.mark.asyncio
async def test_integration_memory_management():
    """Test memory usage during processing"""
    import gc
    import sys
    
    with patch('Mood2FoodRecSys.RecSys.get_user_profile_and_recent_tracks') as mock_tracks, \
         patch('Mood2FoodRecSys.RecSys.compute_time_weights') as mock_weights, \
         patch('Mood2FoodRecSys.RecSys.analyze_mood_with_groq') as mock_mood, \
         patch('Mood2FoodRecSys.RecSys.fetch_data_from_db') as mock_food, \
         patch('Mood2FoodRecSys.RecSys.fetch_preferences_from_db') as mock_prefs, \
         patch('Mood2FoodRecSys.RecSys.compute_mood_distribution') as mock_dist, \
         patch('Mood2FoodRecSys.RecSys.recommend_food_based_on_mood') as mock_rec:
        
        # Create large data sets
        large_tracks = [{"index": i, "track_name": f"track_{i}"} for i in range(1000)]
        large_food = [{"name": f"food_{i}", "tags": [f"tag_{j}" for j in range(10)]} for i in range(5000)]
        
        mock_tracks.return_value = large_tracks
        mock_weights.return_value = [0.001] * 1000
        mock_mood.return_value = [{"mood": ["happy"]} for _ in range(1000)]
        mock_food.return_value = large_food
        mock_prefs.return_value = {"food_preferences": [], "other_preferences": []}
        mock_dist.return_value = [("happy", 1.0)]
        mock_rec.return_value = {"Suggested_food": ["food_1"]}
        
        # Measure memory before
        gc.collect()
        initial_objects = len(gc.get_objects())
        
        # Process request
        result = await get_recommendations("user123", "rest456")
        
        # Measure memory after
        gc.collect()
        final_objects = len(gc.get_objects())
        
        # Memory should not grow excessively
        object_growth = final_objects - initial_objects
        assert object_growth < 1000  # Reasonable growth limit
        assert result["recommended_foods"]["Suggested_food"] == ["food_1"]