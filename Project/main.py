from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from Mood2FoodRecSys.Spotify_Auth import router as spotify_router
from Mood2FoodRecSys.RecSys import router as recsys_router
from database.database import database

# Initialize FastAPI application
app = FastAPI()

# Include Spotify authentication routes
app.include_router(spotify_router)
app.include_router(recsys_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (change to specific domains in production)
    allow_credentials=True,
    allow_methods=["*"], # Allow all HTTP methods
    allow_headers=["*"], # Allow all headers
)

@app.get('/')
def root():
    """Root endpoint to verify API is running"""
    return {"message": "Welcome to the Email Application API"}

@app.on_event("startup")
async def startup():
    """
    Runs when the application starts.
    Establishes database connection if not already connected.
    """
    if not database.is_connected:
        await database.connect()


