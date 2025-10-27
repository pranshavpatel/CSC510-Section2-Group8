import time, httpx, json
from typing import Optional, Dict, Any
from jose import jwt
from fastapi import Depends, HTTPException, status, Header
from functools import lru_cache
from .config import settings

@lru_cache(maxsize=1)
def _jwks_cache() -> Dict[str, Any]:
    # simple cache; refresh process: restart or extend to timed cache
    r = httpx.get(settings.SUPABASE_JWKS_URL, timeout=10.0)
    r.raise_for_status()
    return r.json()

def _get_key_for_kid(kid: str):
    jwks = _jwks_cache()
    for k in jwks.get("keys", []):
        if k.get("kid") == kid:
            return k
    return None

def _verify_jwt(token: str) -> Dict[str, Any]:
    try:
        headers = jwt.get_unverified_header(token)
        key = _get_key_for_kid(headers["kid"])
        if not key:
            raise ValueError("JWKS key not found")
        return jwt.decode(
            token,
            key,
            algorithms=[key.get("alg","RS256")],
            audience=None,  # set if you require
            options={"verify_aud": False}
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

async def current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")
    token = authorization.split(" ", 1)[1]
    claims = _verify_jwt(token)
    # Basic shape: {'sub': '<user_uuid>', 'email': '...', 'role': 'authenticated', ...}
    return {"user_id": claims.get("sub"), "email": claims.get("email")}
