from database.database import database
import os
from dotenv import load_dotenv
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi import Request, APIRouter, HTTPException
import requests, base64, json, time
from urllib.parse import urlencode
import logging

load_dotenv()

# Load Spotify API credentials from environment variables
SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
SPOTIFY_REDIRECT_URI = os.getenv("SPOTIFY_REDIRECT_URI")
SPOTIFY_SCOPES = os.getenv("SPOTIFY_SCOPES")

# Create router for Spotify authentication endpoints
router = APIRouter(
    prefix="/spotify",
    tags=["spotify"],
    responses={404: {"description": "Not found"}},
)

@router.get("/login")
async def spotify_login(user_id: str):
    try:
        if not all([SPOTIFY_CLIENT_ID, SPOTIFY_REDIRECT_URI, SPOTIFY_SCOPES]):
            raise HTTPException(status_code=500, detail="Spotify configuration incomplete")
            
        params = {
            "client_id": SPOTIFY_CLIENT_ID,
            "response_type": "code",
            "redirect_uri": SPOTIFY_REDIRECT_URI,
            "scope": SPOTIFY_SCOPES,
            "state": user_id
        }
        auth_url = f"https://accounts.spotify.com/authorize?{urlencode(params)}"
        return {"URL":RedirectResponse(auth_url)}
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error in spotify_login: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to initiate Spotify login")

@router.get("/callback")
async def spotify_callback(code: str, state: str):
    try:
        if not code:
            raise HTTPException(status_code=400, detail="Missing authorization code")
            
        if not all([SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI]):
            raise HTTPException(status_code=500, detail="Spotify configuration incomplete")

        token_url = "https://accounts.spotify.com/api/token"
        auth_header = base64.b64encode(f"{SPOTIFY_CLIENT_ID}:{SPOTIFY_CLIENT_SECRET}".encode()).decode()
        headers = {"Authorization": f"Basic {auth_header}"}
        data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": SPOTIFY_REDIRECT_URI,
        }

        r = requests.post(token_url, headers=headers, data=data, timeout=10)
        r.raise_for_status()
        token_info = r.json()
        
        if "error" in token_info:
            raise HTTPException(status_code=400, detail=f"Spotify error: {token_info.get('error_description', 'Unknown error')}")

        access_token = token_info.get("access_token")
        refresh_token = token_info.get("refresh_token")
        expires_in = token_info.get("expires_in")
        
        if not access_token or not refresh_token:
            raise HTTPException(status_code=400, detail="Invalid token response from Spotify")
            
        expires_at = int(time.time()) + expires_in if expires_in else None

        # Store tokens in database
        
        user_id = state
        query_state_exists = "SELECT 1 FROM users_spotify_auth_tokens WHERE user_id = :user_id"

        user_exists = await database.fetch_val(query=query_state_exists, values={"user_id": user_id})

        if user_exists:
            query = """
                UPDATE users_spotify_auth_tokens
                SET access_token = :access_token,
                    refresh_token = :refresh_token,
                    expires_at = :expires_at
                WHERE user_id = :user_id
            """
        
        else:
            query = """
            INSERT INTO users_spotify_auth_tokens (user_id, access_token, refresh_token, expires_at)
            VALUES (:user_id, :access_token, :refresh_token, :expires_at)
        """

        await database.execute(query, {
            "user_id": user_id,
            "access_token": access_token,
            "refresh_token": refresh_token,
            "expires_at": expires_at
        })
        
        return {"message": "Spotify tokens stored successfully"}
        
    except HTTPException:
        raise
    except requests.RequestException as e:
        logging.error(f"Request error in spotify_callback: {str(e)}")
        raise HTTPException(status_code=502, detail="Failed to communicate with Spotify")
    except Exception as e:
        logging.error(f"Error in spotify_callback: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process Spotify callback")

@router.get("/refresh")
async def refresh_access_token(refresh_token: str):
    try:
        if not refresh_token:
            raise HTTPException(status_code=400, detail="Refresh token is required")
            
        if not all([SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET]):
            raise HTTPException(status_code=500, detail="Spotify configuration incomplete")
            
        token_url = "https://accounts.spotify.com/api/token"
        auth_header = base64.b64encode(f"{SPOTIFY_CLIENT_ID}:{SPOTIFY_CLIENT_SECRET}".encode()).decode()
        headers = {"Authorization": f"Basic {auth_header}"}
        data = {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
        }

        r = requests.post(token_url, headers=headers, data=data, timeout=10)
        r.raise_for_status()
        new_token = r.json()
        
        if "error" in new_token:
            raise HTTPException(status_code=401, detail=f"Spotify error: {new_token.get('error_description', 'Invalid refresh token')}")
            
        if not new_token.get("access_token"):
            raise HTTPException(status_code=401, detail="Failed to refresh access token")
            
        new_token["expires_at"] = int(time.time()) + new_token.get("expires_in", 0)
        return new_token
        
    except HTTPException:
        raise
    except requests.RequestException as e:
        logging.error(f"Request error in refresh_access_token: {str(e)}")
        raise HTTPException(status_code=502, detail="Failed to communicate with Spotify")
    except Exception as e:
        logging.error(f"Error in refresh_access_token: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to refresh access token")
