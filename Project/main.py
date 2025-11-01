from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from VibeDishRecSys.Spotify_Auth import router as spotify_router
from database.database import database

# Initialize FastAPI application
app = FastAPI()

# Include Spotify authentication routes
app.include_router(spotify_router)

# Configure CORS to allow frontend requests from any origin
# Update allow_origins with specific domains in production for security
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


