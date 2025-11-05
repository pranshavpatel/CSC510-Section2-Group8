import base64
from dotenv import load_dotenv
import os, spotipy, json
import numpy as np
from spotipy.oauth2 import SpotifyClientCredentials, SpotifyOAuth
from datetime import datetime
from collections import defaultdict
from groq import AsyncGroq
from Mood2FoodRecSys.RecSys_Prompts import system_prompt_to_extract_moods, system_prompt_food_rec, generate_user_prompt
from database.database import database
from fastapi import APIRouter, HTTPException
import requests
import time
import logging

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")

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



async def get_spotify_client(user_id: str):
    try:
        if not user_id:
            raise ValueError("user_id is required")
            
        access_token_query = """
            SELECT access_token, refresh_token, expires_at 
            FROM users_spotify_auth_tokens 
            WHERE user_id = :user_id
        """
        values = {"user_id": user_id}

        access_tokens_response = await database.fetch_one(query=access_token_query, values=values)
        
        if not access_tokens_response:
            raise HTTPException(status_code=404, detail="User Spotify authentication not found")

        access_token = access_tokens_response["access_token"]
        refresh_token = access_tokens_response["refresh_token"]
        expires_at = access_tokens_response["expires_at"]

        # check if expired
        if time.time() >= expires_at:
            try:
                # refresh token
                token_url = "https://accounts.spotify.com/api/token"
                auth_header = base64.b64encode(f"{SPOTIFY_CLIENT_ID}:{SPOTIFY_CLIENT_SECRET}".encode()).decode()
                headers = {"Authorization": f"Basic {auth_header}"}
                data = {
                    "grant_type": "refresh_token",
                    "refresh_token": refresh_token
                }

                r = requests.post(token_url, headers=headers, data=data, timeout=10)
                r.raise_for_status()
                token_info = r.json()

                new_access_token = token_info.get("access_token")
                new_expires_in = token_info.get("expires_in")
                
                if not new_access_token or not new_expires_in:
                    raise HTTPException(status_code=401, detail="Failed to refresh Spotify token")
                    
                new_expires_at = int(time.time()) + new_expires_in

                # update DB
                update_query = """
                    UPDATE users_spotify_auth_tokens
                    SET access_token = :access_token,
                        expires_at = :expires_at
                    WHERE user_id = :user_id
                """
                await database.execute(query=update_query, values={
                    "access_token": new_access_token,
                    "expires_at": new_expires_at,
                    "user_id": user_id
                })

                access_token = new_access_token
            except requests.RequestException as e:
                logging.error(f"Failed to refresh Spotify token: {str(e)}")
                raise HTTPException(status_code=401, detail="Failed to refresh Spotify authentication")

        sp = spotipy.Spotify(auth=access_token)
        return sp
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error in get_spotify_client: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to initialize Spotify client")



async def get_user_profile_and_recent_tracks(user_id: str):
    try:
        sp = await get_spotify_client(user_id=user_id)

        #Fetch recently listened tracks
        recent_tracks_data = sp.current_user_recently_played(limit=10)
        
        if not recent_tracks_data or not recent_tracks_data.get("items"):
            return []
            
        songs = []
        for idx, item in enumerate(recent_tracks_data.get("items", []), start=1):
            try:
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
            except (KeyError, ValueError) as e:
                logging.warning(f"Skipping malformed track data: {str(e)}")
                continue
    
        return songs
        
    except spotipy.SpotifyException as e:
        logging.error(f"Spotify API error: {str(e)}")
        raise HTTPException(status_code=401, detail="Spotify authentication failed")
    except Exception as e:
        logging.error(f"Error fetching recent tracks: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch recent tracks")


def compute_time_weights(items_dict: list):
    try:
        if not items_dict:
            return np.array([])
            
        if isinstance(items_dict, list):
            items_dict = {i['index']: i for i in items_dict}

        times = [v["time_stamp"] for v in items_dict.values()]
        if not times:
            return np.array([])
            
        most_recent = max(times)
        deltas = [(most_recent - t) / 60 for t in times]
        weights = np.array([1 / (1+d) for d in deltas])
        
        total_weight = np.sum(weights)
        if total_weight == 0:
            return np.ones(len(weights)) / len(weights)
            
        weights /= total_weight
        return weights
        
    except Exception as e:
        logging.error(f"Error computing time weights: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to compute time weights")

async def analyze_mood_with_groq(items_dict: dict):
    try:
        if not items_dict:
            return []
            
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
            temperature=0.5
        )
        
        content = response.choices[0].message.content
        if not content:
            raise ValueError("Empty response from Groq API")
            
        return json.loads(content)
        
    except json.JSONDecodeError as e:
        logging.error(f"Failed to parse Groq response as JSON: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to parse mood analysis response")
    except Exception as e:
        logging.error(f"Error analyzing mood with Groq: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to analyze mood")

def compute_mood_distribution(response_json, weights):
    try:
        if not response_json or len(weights) == 0:
            return []
            
        mood_weights = defaultdict(float)

        for i, song in enumerate(response_json):
            if i >= len(weights):
                break
            if "mood" not in song or not isinstance(song["mood"], list):
                continue
                
            for mood in song["mood"]:
                if isinstance(mood, str):
                    mood_weights[mood.lower()] += weights[i]

        total = sum(mood_weights.values())
        if total == 0:
            return []

        normalized_moods = {m: w / total for m, w in mood_weights.items()}
        return sorted(normalized_moods.items(), key=lambda x: x[1], reverse=True)
        
    except Exception as e:
        logging.error(f"Error computing mood distribution: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to compute mood distribution")



async def recommend_food_based_on_mood(top_moods, preference, relevant_food_items):
    try:
        if not top_moods or not relevant_food_items:
            return {"Suggested_food": []}
            
        user_prompt = generate_user_prompt(top_moods, preference, relevant_food_items)

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
            temperature=0.5
        )
        
        content = response_food_rec.choices[0].message.content
        if not content:
            raise ValueError("Empty response from Groq API")

        return json.loads(content)
        
    except json.JSONDecodeError as e:
        logging.error(f"Failed to parse food recommendation response as JSON: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to parse food recommendation response")
    except Exception as e:
        logging.error(f"Error recommending food: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate food recommendations")



async def fetch_data_from_db(restaurant_id):
    try:
        if not restaurant_id:
            raise ValueError("restaurant_id is required")
            
        query = "SELECT name, tags from meals WHERE restaurant_id =:restaurant_id"
        values = {"restaurant_id": restaurant_id}

        response = await database.fetch_all(query=query, values=values)
        response = [dict(r) for r in response]
        return response
        
    except Exception as e:
        logging.error(f"Error fetching restaurant data: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch restaurant data")




async def fetch_preferences_from_db(user_id):
    try:
        if not user_id:
            raise ValueError("user_id is required")
            
        query = "SELECT food_preferences, other_preferences from users_preferences WHERE user_id =:user_id"
        values = {"user_id": user_id}

        response = await database.fetch_one(query=query, values=values)
        return response if response else {"food_preferences": [], "other_preferences": []}
        
    except Exception as e:
        logging.error(f"Error fetching user preferences: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch user preferences")