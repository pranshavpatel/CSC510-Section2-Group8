from Mood2FoodRecSys.RecSysFunctions import get_user_profile_and_recent_tracks, compute_time_weights, analyze_mood_with_groq, compute_mood_distribution, recommend_food_based_on_mood, fetch_data_from_db, fetch_preferences_from_db
from fastapi import APIRouter, HTTPException
import asyncio
import logging


router = APIRouter(
    prefix="/recsys",
    tags=["Mood-based food recommendation system"],
    responses={404: {"description": "Not found"}},
)



@router.post("/get_recommendations")
async def get_recommendations(user_id: str, restaurant_id: str):
    try:
        if not user_id or not restaurant_id:
            raise HTTPException(status_code=400, detail="user_id and restaurant_id are required")

        recent_tracks = await get_user_profile_and_recent_tracks(user_id=user_id)
        if not recent_tracks:
            raise HTTPException(status_code=404, detail="No recent tracks found for user")

        weights = compute_time_weights(recent_tracks)
        
        mood_analysis, relevant_food_items, preferences = await asyncio.gather(
            analyze_mood_with_groq(recent_tracks),
            fetch_data_from_db(restaurant_id=restaurant_id),
            fetch_preferences_from_db(user_id=user_id)
        )
        
        if not relevant_food_items:
            raise HTTPException(status_code=404, detail="No food items found for restaurant")
            
        mood_distribution = compute_mood_distribution(mood_analysis, weights)
        food_recommendations = await recommend_food_based_on_mood(mood_distribution, preferences, relevant_food_items)

        return {"recommended_foods": food_recommendations}
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error in get_recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error occurred while generating recommendations")