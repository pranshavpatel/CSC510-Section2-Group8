from database.database import database
import os
from dotenv import load_dotenv
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi import Request, APIRouter
import requests, base64, json, time
from urllib.parse import urlencode

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
async def spotify_login():
    params = {
        "client_id": SPOTIFY_CLIENT_ID,
        "response_type": "code",
        "redirect_uri": SPOTIFY_REDIRECT_URI,
        "scope": SPOTIFY_SCOPES,
    }
    auth_url = f"https://accounts.spotify.com/authorize?{urlencode(params)}"
    return RedirectResponse(auth_url)

@router.get("/callback")
# whether it is successful or not redirect to frontend and add a code portion to add the data to db
async def spotify_callback(code: str):
    # code = request.query_params.get("code")
    # code = code
    if not code:
        return JSONResponse({"error": "Missing code"}, status_code=400)

    token_url = "https://accounts.spotify.com/api/token"

    # Create base64 encoded authorization header
    auth_header = base64.b64encode(f"{SPOTIFY_CLIENT_ID}:{SPOTIFY_CLIENT_SECRET}".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}

    # Request access token from Spotify
    data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": SPOTIFY_REDIRECT_URI,
    }

    r = requests.post(token_url, headers=headers, data=data)
    token_info = r.json()

    # Extract token information
    access_token = token_info.get("access_token")
    refresh_token = token_info.get("refresh_token")
    expires_in = token_info.get("expires_in") # Token lifetime in seconds
    expires_at = int(time.time()) + expires_in if expires_in else None # Calculate expiration timestamp

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "expires_in": expires_in,
        "expires_at": expires_at,
    }

@router.get("/refresh")
async def refresh_access_token(refresh_token: str):
    token_url = "https://accounts.spotify.com/api/token"

    # Create base64 encoded authorization header
    auth_header = base64.b64encode(f"{SPOTIFY_CLIENT_ID}:{SPOTIFY_CLIENT_SECRET}".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}

    # Request new access token
    data = {
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
    }
    r = requests.post(token_url, headers=headers, data=data)
    new_token = r.json()

    # Calculate and add expiration timestamp
    new_token["expires_at"] = int(time.time()) + new_token.get("expires_in", 0)
    return new_token