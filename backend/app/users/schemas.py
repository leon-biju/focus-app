import uuid
from datetime import datetime, time

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.core.time import valid_timezones
from app.users.models import Theme


class UserProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    display_name: str
    created_at: datetime


class UserProfileUpdate(BaseModel):
    # This is the only non auth field in user. Required and non-blank: the column is
    # NOT NULL, so there's no "clear it" state to fall back to.
    display_name: str = Field(max_length=80)

    @field_validator("display_name")
    @classmethod
    def display_name_must_not_be_blank(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("display name must not be blank")
        return stripped


class UserSettingsRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    timezone: str
    day_start_time: time
    focus_minutes: int
    break_minutes: int
    flexible_timers: bool
    theme: Theme
    updated_at: datetime


class UserSettingsUpdate(BaseModel):
    # All optional
    timezone: str | None = None
    day_start_time: time | None = None
    focus_minutes: int | None = Field(default=None, ge=5, le=180)
    break_minutes: int | None = Field(default=None, ge=1, le=60)
    flexible_timers: bool | None = None
    theme: Theme | None = None

    @field_validator("timezone")
    @classmethod
    def timezone_must_be_iana(cls, v: str | None) -> str | None:
        if v is not None and v not in valid_timezones():
            raise ValueError("Unknown IANA timezone")
        return v

    @field_validator("day_start_time")
    @classmethod
    def day_start_after_dst_window(cls, v: time | None) -> time | None:
        # DST transitions cluster in 00:00-03:59 local; a cutoff there can make
        # the write and read paths disagree on which day an instant belongs to.
        if v is not None and v < time(4, 0):
            raise ValueError("day start must be 04:00 or later")
        return v


class UserMeRead(BaseModel):
    # Profile and settings in one payload
    profile: UserProfileRead
    settings: UserSettingsRead
