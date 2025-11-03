from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .routers import meals, catalog, orders, debug_auth, auth_routes, me
import sys

app = FastAPI(title="VibeDish API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok"}

app.include_router(auth_routes.router)
app.include_router(me.router)
app.include_router(meals.router, prefix="/meals", tags=["meals"])
app.include_router(catalog.router, prefix="/catalog", tags=["catalog"])
app.include_router(orders.router, prefix="/orders", tags=["orders"])
app.include_router(debug_auth.router, prefix="/debug", tags=["debug"])