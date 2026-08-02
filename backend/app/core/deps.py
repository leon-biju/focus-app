from dataclasses import dataclass
from datetime import date, datetime, time, timedelta

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
import jwt
import uuid
from zoneinfo import ZoneInfo

from app.db import get_db
from app.config import settings
from app.core.time import day_window
from app.auth.models import User
from app.users.services import get_settings

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


@dataclass(frozen=True)
class DayContext:
    today: date
    tz: str
    day_start: time
    day_end: time

    def window_for(self, on: date | None = None) -> tuple[datetime, datetime]:
        return day_window(on or self.today, self.tz, self.day_start, self.day_end)

    @property
    def prev_start(self) -> datetime:
        start, _ = day_window(self.today - timedelta(days=1), self.tz, self.day_start, self.day_end)
        return start


async def get_day_context(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
) -> DayContext:
    user_settings = await get_settings(session, user.id)
    today = datetime.now(ZoneInfo(user_settings.timezone)).date()

    return DayContext(
        today=today,
        tz=user_settings.timezone,
        day_start=user_settings.day_start,
        day_end=user_settings.day_end,
    )
