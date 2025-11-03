from dotenv import load_dotenv
import os, spotipy, json
import numpy as np
from spotipy.oauth2 import SpotifyClientCredentials, SpotifyOAuth
from datetime import datetime
from collections import defaultdict
from groq import AsyncGroq
from Mood2FoodRecSys.RecSys_Prompts import system_prompt_to_extract_moods, system_prompt_food_rec
from database.database import database
from fastapi import APIRouter

load_dotenv()

router = APIRouter(
    prefix="/recsys",
    tags=["mood based recommendation system"],
    responses={404: {"description": "Not found"}},
)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")   

client = AsyncGroq(api_key=GROQ_API_KEY)

# async def get_user_profile(access_token: str):
#     headers = {"Authorization": f"Bearer {access_token}"}
#     user_data = requests.get("https://api.spotify.com/v1/me", headers=headers)

#     if user_data.status_code != 200:
#         raise Exception("Error fetching user data.")
    
#     user_info = {
#         "display_name": user_data.get("display_name"),
#         "id": user_data.get("id"),
#         "email": user_data.get("email"),
#         "country": user_data.get("country"),
#         "followers": user_data.get("followers", {}).get("total"),
#         "product": user_data.get("product"),
#         "profile_image": user_data.get("images", [{}])[0].get("url"),
#         "external_url": user_data.get("external_urls", {}).get("spotify")
#     }

#     return headers, user_info

# async def get_user_profile_and_recent_tracks(access_token: str):

#     user_info = await get_user_profile(access_token)

#     headers = {"Authorization": f"Bearer {access_token}"}
#     user_resp = requests.get("https://api.spotify.com/v1/me/player/recently-played?limit=10", headers=headers)

#     if user_resp.status_code != 200:
#         return {"error": "Failed to fetch recent tracks", "details": recent_resp.json()}
#     recent_resp = user_resp.json()



def get_spotify_client(access_token: str):
    
    sp = spotipy.Spotify(auth=access_token)
    return sp


def get_user_profile_and_recent_tracks(access_token: str):

    sp = get_spotify_client(access_token= access_token)

    # Fetch user profile

    user_profile = sp.current_user()

    user_info = {
        "display_name": user_profile.get("display_name"),
        "id": user_profile.get("id"),
        "email": user_profile.get("email"),
        "country": user_profile.get("country"),
        "followers": user_profile.get("followers", {}).get("total"),
        "product": user_profile.get("product"),
        "profile_image": user_profile.get("images", [{}])[0].get("url"),
        "external_url": user_profile.get("external_urls", {}).get("spotify")
    }


    #Fetch recently listened tracks
    recent_tracks_data = sp.current_user_recently_played(limit=10)
    songs = []
    for idx, item in enumerate(recent_tracks_data.get("items", []), start=1):
        track = item["track"]
        artist_names = ", ".join([artist["name"] for artist in track["artists"]])
        played_at_utc = datetime.fromisoformat(item["played_at"].replace("Z", "+00:00"))
        played_at_local = played_at_utc.astimezone()
        time_stamp = played_at_local.timestamp()

        songs.append({
            "index": idx,
            "track_name": track["name"],
            "artists": artist_names,
            "played_at": played_at_local.strftime("%Y-%m-%d %H:%M:%S"),
            "time_stamp": time_stamp,
        })

    
    return user_info, songs


def compute_time_weights(items_dict: dict):
    times = [v["time_stamp"] for v in items_dict.values()]
    most_recent = max(times)
    deltas = [(most_recent - t) / 60 for t in times]
    weights = np.array([1 / (1+d) for d in deltas])
    weights /= np.sum(weights)
    return weights

async def analyze_mood_with_groq(items_dict: dict):

    response = await client.chat.completions.create(
        messages=[
            {
                "role": "system",
                "content": system_prompt_to_extract_moods
            },
            {
                "role": "user",
                "content": str(items_dict)
            }
        ],
        model="llama-3.3-70b-versatile",
        temperature= 0.5 
    )

    return json.loads(response.choices[0].message.content)

def compute_mood_distribution(response_json, weights):
    mood_weights = defaultdict(float)

    for i, song in enumerate(response_json):
        for mood in song["mood"]:
            mood_weights[mood.lower()] += weights[i]

    
    total = sum(mood_weights.values())

    normalized_moods = {m: w / total for m, w in mood_weights.items()}

    return sorted(normalized_moods.items(), key=lambda x: x[1], reverse=True)

async def recommend_food_based_on_mood(top_moods, preference):

    user_prompt = f"""
    
        "moods": {top_moods},
        "food_preference": {preference["food_preference"]},
        "other_preferences": {preference["other_preferences"] if preference["other_preferences"] else []}
    """

    response_food_rec = await client.chat.completions.create(
        messages=[
            {
                "role": "system",
                "content": system_prompt_food_rec
            },
            {
                "role": "user",
                "content": user_prompt
            }
        ],
        model="llama-3.3-70b-versatile",
        temperature= 0.5
    )

    return json.loads(response_food_rec.choices[0].message.content)



async def fetch_data_from_db(restaurant_id):


    query = "SELECT name, tags from meals WHERE restaurant_id =:restaurant_id"
    values = {"restaurant_id": restaurant_id}

    response = await database.fetch_all(query=query, values=values)

    print(type(response))
    return {"data": response}



