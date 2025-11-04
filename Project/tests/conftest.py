import pytest
import sys
import pathlib
from unittest.mock import AsyncMock, MagicMock

# Add project root to path
ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

@pytest.fixture
def mock_database():
    """Mock database fixture for all tests"""
    mock_db = MagicMock()
    mock_db.fetch_one = AsyncMock()
    mock_db.fetch_all = AsyncMock()
    mock_db.execute = AsyncMock()
    return mock_db

@pytest.fixture
def mock_spotify_client():
    """Mock Spotify client fixture"""
    mock_client = MagicMock()
    mock_client.current_user_recently_played = MagicMock()
    return mock_client

@pytest.fixture
def mock_groq_client():
    """Mock Groq client fixture"""
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.choices[0].message.content = '{"test": "response"}'
    mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
    return mock_client

@pytest.fixture
def sample_tracks():
    """Sample track data for testing"""
    return [
        {
            "index": 1,
            "track_name": "Happy Song",
            "artists": "Test Artist",
            "played_at": "2023-01-01 12:00:00",
            "time_stamp": 1672574400
        },
        {
            "index": 2,
            "track_name": "Sad Song", 
            "artists": "Another Artist",
            "played_at": "2023-01-01 12:05:00",
            "time_stamp": 1672574700
        }
    ]

@pytest.fixture
def sample_food_items():
    """Sample food items for testing"""
    return [
        {"name": "Pizza", "tags": ["italian", "comfort", "cheese"]},
        {"name": "Salad", "tags": ["healthy", "fresh", "vegetarian"]},
        {"name": "Burger", "tags": ["american", "comfort", "meat"]}
    ]

@pytest.fixture
def sample_preferences():
    """Sample user preferences for testing"""
    return {
        "food_preferences": ["italian", "vegetarian"],
        "other_preferences": ["low-calorie", "quick"]
    }