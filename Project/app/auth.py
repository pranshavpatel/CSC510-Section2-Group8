# app/auth.py
import httpx
from jose import jwt, JWTError
from fastapi import Header, HTTPException
from functools import lru_cache
from typing import Any, Dict, Optional
from .config import settings

class AuthError(HTTPException):
    def __init__(self, detail: str):
        super().__init__(status_code=401, detail=detail)

@lru_cache(maxsize=1)
def get_jwks() -> Dict[str, Any]:
    if not settings.SUPABASE_JWKS_URL:
        return {"keys": []}
    r = httpx.get(settings.SUPABASE_JWKS_URL, timeout=10.0)
    r.raise_for_status()
    return r.json()

def _decode_rs256(token: str) -> Dict[str, Any]:
    jwks = get_jwks()
    unverified = jwt.get_unverified_header(token)
    kid = unverified.get("kid")
    key = None
    for k in jwks.get("keys", []):
        if k.get("kid") == kid:
            key = k
            break
    if not key:
        raise AuthError("RS256: JWKS key not found for this token")
    return jwt.decode(
        token,
        key,
        algorithms=[key.get("alg", "RS256")],
        options={"verify_aud": False},
    )

def _decode_hs256(token: str) -> Dict[str, Any]:
    if not settings.SUPABASE_JWT_SECRET:
        raise AuthError("HS256: SUPABASE_JWT_SECRET not configured in .env")
    return jwt.decode(
        token,
        settings.SUPABASE_JWT_SECRET,
        algorithms=["HS256"],
        options={"verify_aud": False},
    )

async def current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    if not authorization:
        raise AuthError("Missing Authorization header")
    if not authorization.lower().startswith("bearer "):
        raise AuthError("Authorization must be Bearer <token>")

    token = authorization.split(" ", 1)[1].strip()

    # 👉 basic JWT shape check
    if token.count(".") != 2:
        raise AuthError("Token is not in JWT format (expect 3 parts: header.payload.signature)")

    # read alg from header
    try:
        unverified = jwt.get_unverified_header(token)
    except JWTError as e:
        # this is the exact error you’re seeing
        raise AuthError(f"Invalid JWT header: {e}")

    alg = unverified.get("alg")

    if alg == "HS256":
        claims = _decode_hs256(token)
    elif alg == "RS256":
        claims = _decode_rs256(token)
    else:
        raise AuthError(f"Unsupported alg: {alg}")

    sub = claims.get("sub") or claims.get("user_id")
    if not sub:
        raise AuthError("Token decoded but no sub/user_id in payload")

    return {
        "id": sub,
        "email": claims.get("email"),
        "claims": claims,
    }
