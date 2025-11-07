from Mood2FoodRecSys.RecSysFunctions import get_user_profile_and_recent_tracks, compute_time_weights, analyze_mood_with_groq, compute_mood_distribution, recommend_food_based_on_mood, fetch_data_from_db, fetch_preferences_from_db
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.auth import current_user
import asyncio
import logging
import random


router = APIRouter(
    prefix="/recsys",
    tags=["Mood-based food recommendation system"],
    responses={404: {"description": "Not found"}},
)


class RecommendationRequest(BaseModel):
    restaurant_id: str


@router.post("/get_recommendations")
async def get_recommendations(
    request: RecommendationRequest,
    user: dict = Depends(current_user)
):
    try:
        user_id = user["id"]
        restaurant_id = request.restaurant_id
        
        if not restaurant_id:
            raise HTTPException(status_code=400, detail="restaurant_id is required")

        recent_tracks = await get_user_profile_and_recent_tracks(user_id=user_id)
        if not recent_tracks:
            raise HTTPException(status_code=404, detail="No recent tracks found for user")

        weights = compute_time_weights(recent_tracks)
        
        mood_analysis, relevant_food_items, preferences = await asyncio.gather(
            analyze_mood_with_groq(recent_tracks),
            fetch_data_from_db(restaurant_id=restaurant_id),
            fetch_preferences_from_db(user_id=user_id)
        )
        
        # Return empty array instead of 404 if no food items
        if not relevant_food_items:
            return {"recommended_foods": []}
            
        mood_distribution = compute_mood_distribution(mood_analysis, weights)
        food_recommendations = await recommend_food_based_on_mood(mood_distribution, preferences, relevant_food_items)

        suggested = food_recommendations.get("Suggested_food", [])

        # extract just ids
        recommended_ids = [item["id"] for item in suggested]

        # now match back
        recommended_full_objects = [item for item in relevant_food_items if str(item["id"]) in recommended_ids]
        
        # Randomly limit recommendations to either 3 or 4 items
        limit = random.choice([3, 4])
        recommended_full_objects = recommended_full_objects[:limit]
        
        return {"recommended_foods": recommended_full_objects}
        
    except HTTPException as http_ex:
        # Re-raise HTTP exceptions with their original status code
        raise http_ex
    except Exception as e:
        # Log unexpected errors and return 500
        logging.error(f"Unexpected error in get_recommendations: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error while generating recommendations")