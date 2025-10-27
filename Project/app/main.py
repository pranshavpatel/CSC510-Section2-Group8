from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .routers import meals

# add this temporarily in app/main.py after imports
import os
print("CWD:", os.getcwd())
from .config import settings
print("DB URL present:", bool(settings.DATABASE_URL))

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

app.include_router(meals.router, prefix="/meals", tags=["meals"])
