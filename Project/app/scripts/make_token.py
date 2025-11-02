# scripts/make_token.py
import os, time
from jose import jwt
from uuid import uuid4

SECRET = os.getenv("SUPABASE_JWT_SECRET")
if not SECRET:
    raise SystemExit("SUPABASE_JWT_SECRET not set in env/.env")

now=int(time.time())

# you can pass USER_ID=... and EMAIL=...
user_id=os.getenv("USER_ID") or str(uuid4())
email=os.getenv("EMAIL") or "devuser@example.com"

payload={
    "sub":user_id,
    "email":email,
    "role":"authenticated",
    "iat":now,
    "exp":now+3600  # 1 hr
}

token=jwt.encode(payload,SECRET,algorithm="HS256")
print(token)
