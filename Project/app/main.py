from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .routers import meals, catalog, orders, debug_auth, auth_routes, me, address, cart
from .owner_meals import router as owner_meals_router
from .owner_meals import restaurant
import sys
from Mood2FoodRecSys.Spotify_Auth import router as spotify_router
from Mood2FoodRecSys.RecSys import router as recsys_router
from database.database import database

app = FastAPI(title="VibeDish API", version="0.1.0")

# Database lifecycle events
@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

app.add_middleware(
    CORSMiddleware,
    # allow_origins=settings.ALLOWED_ORIGINS,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok"}

app.include_router(auth_routes.router)
app.include_router(me.router)
app.include_router(address.router)
app.include_router(cart.router)
app.include_router(meals.router, prefix="/meals", tags=["meals"])
app.include_router(catalog.router, prefix="/catalog", tags=["catalog"])
app.include_router(orders.router, prefix="/orders", tags=["orders"])
app.include_router(debug_auth.router, prefix="/debug", tags=["debug"])
app.include_router(owner_meals_router.router, prefix="/owner/meals", tags=["owner-meals"])
app.include_router(restaurant.router, prefix="/owner/restaurant", tags=["owner-restaurant"])
app.include_router(spotify_router)
app.include_router(recsys_router)