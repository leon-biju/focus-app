from dataclasses import dataclass
from datetime import UTC, date, datetime, time

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
import jwt
import uuid

from app.db import get_db
from app.config import settings
from app.core.time import day_window, logical_date
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
    today: date        # the user's current logical date
    start: datetime    # UTC instant the day began (inclusive)
    end: datetime      # UTC instant the day ends (exclusive)
    tz: str
    day_start: time

    def window_for(self, on: date | None) -> tuple[datetime, datetime]:
        # For endpoints that take an optional ?date=. None means today, which is
        # already computed, so only another day costs the conversion.
        if on is None or on == self.today:
            return self.start, self.end
        return day_window(on, self.tz, self.day_start)


async def get_day_context(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
) -> DayContext:
    user_settings = await get_settings(session, user.id)
    today = logical_date(datetime.now(UTC), user_settings.timezone, user_settings.day_start_time)
    start, end = day_window(today, user_settings.timezone, user_settings.day_start_time)

    return DayContext(
        today=today,
        start=start,
        end=end,
        tz=user_settings.timezone,
        day_start=user_settings.day_start_time,
    )
