from pwdlib import PasswordHash
import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone
import jwt

from app.config import settings

pwd = PasswordHash.recommended()

DUMMY_HASH = pwd.hash("dummypassword")

def hash_password(password: str) -> str:
    return pwd.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd.verify(plain, hashed)

def create_access_token(user_id: uuid.UUID)-> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)

    return jwt.encode(
        payload={"sub": str(user_id), "exp": expire},
        key=settings.jwt_secret,
        algorithm=settings.jwt_algorithm
    )

def generate_refresh_token() -> str:
    return secrets.token_urlsafe(32) # 256 bits

def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()