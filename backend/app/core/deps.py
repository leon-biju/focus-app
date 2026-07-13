from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
import jwt
import uuid

from app.db import get_db
from app.config import settings
from app.users.models import User

bearer_scheme = HTTPBearer()

async def get_current_user(
        credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
        session: AsyncSession = Depends(get_db)
        ) -> User:
    auth_error = HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials.")

    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        user_id = uuid.UUID(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        raise auth_error
    
    user = await session.get(User, user_id)

    if user is None:
        raise auth_error
    
    return user
