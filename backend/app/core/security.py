from pwdlib import PasswordHash
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

def decode_token(token: str) -> uuid.UUID:
    try:
        payload = jwt.decode(
            jwt=token,
            key=settings.jwt_secret,
            algorithms=[settings.jwt_algorithm]
        )

        user_id = payload.get("sub")
        
        if user_id is None:
            raise ValueError("sub is missing")
        
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except jwt.JWTError:
        raise ValueError("Invalid token")
    return