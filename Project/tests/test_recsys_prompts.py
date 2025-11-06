import pytest
import sys
import pathlib
import json

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from Mood2FoodRecSys.RecSys_Prompts import generate_user_prompt


def test_generate_user_prompt_success():
    top_moods = [("happy", 0.8), ("energetic", 0.2)]
    preference = {"food_preferences": ["italian"], "other_preferences": ["vegetarian"]}
    relevant_food_items = [{"id": "1", "name": "pizza", "tags": ["italian", "comfort"]}]
    
    result = generate_user_prompt(top_moods, preference, relevant_food_items)
    
    assert "happy" in result
    assert "italian" in result
    assert "available_items" in result


def test_generate_user_prompt_empty_food_items():
    top_moods = [("happy", 0.8)]
    preference = {"food_preferences": ["italian"], "other_preferences": []}
    relevant_food_items = []
    
    result = generate_user_prompt(top_moods, preference, relevant_food_items)
    
    assert "happy" in result
    assert "italian" in result
    assert "{}" in result


def test_generate_user_prompt_none_preference():
    top_moods = [("happy", 0.8)]
    preference = None
    relevant_food_items = [{"id": "1", "name": "pizza", "tags": ["italian"]}]
    
    result = generate_user_prompt(top_moods, preference, relevant_food_items)
    
    assert "happy" in result
    assert "available_items" in result


def test_generate_user_prompt_missing_preference_keys():
    top_moods = [("happy", 0.8)]
    preference = {"food_preferences": ["italian"]}
    relevant_food_items = [{"id": "1", "name": "pizza", "tags": ["italian"]}]
    
    result = generate_user_prompt(top_moods, preference, relevant_food_items)
    
    assert "happy" in result
    assert "italian" in result


def test_generate_user_prompt_malformed_food_items():
    top_moods = [("happy", 0.8)]
    preference = {"food_preferences": ["italian"], "other_preferences": []}
    relevant_food_items = [{"name": "pizza"}, {"tags": ["italian"]}]
    
    result = generate_user_prompt(top_moods, preference, relevant_food_items)
    
    assert "happy" in result
    assert "italian" in result


def test_generate_user_prompt_exception_handling():
    top_moods = None
    preference = "invalid"
    relevant_food_items = "invalid"
    
    result = generate_user_prompt(top_moods, preference, relevant_food_items)
    
    assert "moods" in result
    assert "food_preference" in result


def test_generate_user_prompt_unicode_characters():
    """Test with unicode and special characters"""
    top_moods = [("😊happy", 0.8), ("énergétique", 0.2)]
    preference = {
        "food_preferences": ["spicy🌶️", "végétarien"],
        "other_preferences": ["low-calorie", "quick&easy"]
    }
    relevant_food_items = [
        {"id": "1", "name": "Pizza Margherita 🍕", "tags": ["italian", "cheese"]},
        {"id": "2", "name": "Café au Lait ☕", "tags": ["french", "beverage"]}
    ]
    
    result = generate_user_prompt(top_moods, preference, relevant_food_items)
    
    assert "😊happy" in result
    assert "spicy🌶️" in result
    assert "available_items" in result


def test_generate_user_prompt_large_dataset():
    """Test with large amounts of data"""
    top_moods = [(f"mood_{i}", 0.01) for i in range(100)]
    
    preference = {
        "food_preferences": [f"pref_{i}" for i in range(50)],
        "other_preferences": [f"other_{i}" for i in range(30)]
    }
    
    relevant_food_items = [
        {"id": str(i), "name": f"food_{i}", "tags": [f"tag_{j}" for j in range(5)]}
        for i in range(200)
    ]
    
    result = generate_user_prompt(top_moods, preference, relevant_food_items)
    
    assert "mood_0" in result
    assert "pref_0" in result
    assert "available_items" in result
    assert len(result) > 1000


def test_generate_user_prompt_circular_references():
    """Test with potentially problematic data structures"""
    preference = {"food_preferences": [], "other_preferences": []}
    preference["self_ref"] = preference
    
    top_moods = [("happy", 0.8)]
    relevant_food_items = [{"id": "1", "name": "pizza", "tags": ["italian"]}]
    
    result = generate_user_prompt(top_moods, preference, relevant_food_items)
    assert "happy" in result


def test_generate_user_prompt_extreme_values():
    """Test with extreme numerical values"""
    top_moods = [
        ("happy", float('inf')),
        ("sad", -float('inf')),
        ("neutral", float('nan'))
    ]
    
    preference = {"food_preferences": ["test"], "other_preferences": []}
    relevant_food_items = [{"id": "1", "name": "pizza", "tags": ["italian"]}]
    
    result = generate_user_prompt(top_moods, preference, relevant_food_items)
    assert "happy" in result
    assert "available_items" in result


def test_generate_user_prompt_empty_strings():
    """Test with empty strings and whitespace"""
    top_moods = [("", 0.5), ("   ", 0.3), ("\n\t", 0.2)]
    preference = {
        "food_preferences": ["", "   ", "valid_pref"],
        "other_preferences": ["\n", "\t", ""]
    }
    relevant_food_items = [
        {"id": "1", "name": "", "tags": ["", "valid_tag"]},
        {"id": "2", "name": "   ", "tags": ["\n", "\t"]},
        {"id": "3", "name": "valid_food", "tags": ["tag1"]}
    ]
    
    result = generate_user_prompt(top_moods, preference, relevant_food_items)
    assert "valid_pref" in result
    assert "available_items" in result


def test_generate_user_prompt_nested_data_structures():
    """Test with nested data structures"""
    top_moods = [("happy", 0.8)]
    preference = {
        "food_preferences": [["nested", "list"], {"nested": "dict"}],
        "other_preferences": [{"complex": ["structure", {"deep": "nesting"}]}]
    }
    relevant_food_items = [
        {
            "id": "1",
            "name": "complex_food",
            "tags": [["nested", "tags"], {"tag_dict": "value"}]
        }
    ]
    
    result = generate_user_prompt(top_moods, preference, relevant_food_items)
    assert "happy" in result
    assert "available_items" in result
