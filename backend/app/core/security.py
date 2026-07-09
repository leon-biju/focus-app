from pwdlib import PasswordHash
import uuid
from datetime import datetime, timedelta, timezone
import jwt

from backend.app.config import settings

pwd = PasswordHash.recommended()

def hash_password(password: str) -> str:
    return pwd.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd.verify(plain, hashed)

def create_access_token(user_id: uuid.UUID)-> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)

    return jwt.encode({"sub": str(user_id), "exp": expire}, settings.jwt_secret, algorithm=settings.jwt_algorithm)