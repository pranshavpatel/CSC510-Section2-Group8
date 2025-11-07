# app/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator, model_validator
from typing import List, Optional


class Settings(BaseSettings):
    # Required
    DATABASE_URL: str = "postgresql://test:test@localhost:5432/test"
    SUPABASE_URL: str = "https://test.supabase.co"     

    # Optional auth bits
    SUPABASE_JWKS_URL: Optional[str] = None   # derived if not provided
    SUPABASE_JWT_SECRET: Optional[str] = None
    SUPABASE_ANON_KEY: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None

    # CORS
    ALLOWED_ORIGINS: List[str] = Field(
        default_factory=lambda: ["http://localhost:5173"]
    )

    # S3/Tigris Configuration
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_ENDPOINT_URL: Optional[str] = None
    AWS_REGION: str = "auto"
    S3_BUCKET_NAME: Optional[str] = None

    # Derived (not read from env)
    ASYNC_DATABASE_URL: Optional[str] = None  # computed from DATABASE_URL

    # Parse comma/JSON string into list for ALLOWED_ORIGINS
    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_origins(cls, v):
        if isinstance(v, str):
            v = v.strip()
            # allow JSON-style ["...","..."]
            if v.startswith("["):
                return v
            # allow comma-separated
            return [s.strip() for s in v.split(",") if s.strip()]
        return v

    @model_validator(mode="after")
    def _derive_fields(self):
        # Normalize SUPABASE_URL (strip trailing slash)
        self.SUPABASE_URL = self.SUPABASE_URL.rstrip("/")

        # Derive JWKS URL if not provided
        if not self.SUPABASE_JWKS_URL:
            self.SUPABASE_JWKS_URL = f"{self.SUPABASE_URL}/auth/v1/keys"

        # Build an async URL for SQLAlchemy if needed
        url = self.DATABASE_URL
        # Handle postgres:// (old Heroku style)
        if url.startswith("postgres://"):
            url = "postgresql+asyncpg://" + url[len("postgres://"):]
        # Handle postgresql:// without driver
        elif url.startswith("postgresql://") and "+" not in url:
            url = "postgresql+asyncpg://" + url[len("postgresql://"):]
        # Handle postgresql+asyncpg:// (already correct)
        elif url.startswith("postgresql+asyncpg://"):
            pass  # already correct
        # Handle any other postgresql+driver:// by replacing driver
        elif url.startswith("postgresql+"):
            url = "postgresql+asyncpg://" + url.split("://", 1)[1]
        self.ASYNC_DATABASE_URL = url

        return self

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
