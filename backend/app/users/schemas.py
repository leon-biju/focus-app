import uuid
from datetime import datetime, time

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.users.models import Theme


class UserProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    display_name: str | None
    created_at: datetime


class UserProfileUpdate(BaseModel):
    # This is the only non auth field in user
    display_name: str | None = Field(default=None, max_length=80)


class UserSettingsRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    day_start_time: time
    focus_minutes: int
    break_minutes: int
    flexible_timers: bool
    theme: Theme
    updated_at: datetime


class UserSettingsUpdate(BaseModel):
    # All optional
    day_start_time: time | None = None
    focus_minutes: int | None = Field(default=None, ge=5, le=180)
    break_minutes: int | None = Field(default=None, ge=1, le=60)
    flexible_timers: bool | None = None
    theme: Theme | None = None


class UserMeRead(BaseModel):
    # Profile and settings in one payload
    profile: UserProfileRead
    settings: UserSettingsRead
