from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from Mood2FoodRecSys.Spotify_Auth import router as spotify_router
from database.database import database

app = FastAPI()

app.include_router(spotify_router)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update as needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get('/')
def root():
    return {"message": "Welcome to the Email Application API"}

@app.on_event("startup")
async def startup():
    if not database.is_connected:
        await database.connect()


