import uuid
from datetime import datetime, time
from enum import StrEnum

from sqlalchemy import Enum, ForeignKey, Time, func, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Theme(StrEnum):
    light = "light"
    dark = "dark"


class UserSettings(Base):
    __tablename__ = "user_settings"

    # Since it's one-to-one we can just use the user_id as the primary key as well
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )

    timezone: Mapped[str] = mapped_column(String(64), default="UTC")
    day_start: Mapped[time] = mapped_column(Time, default=time(8, 0))
    day_end: Mapped[time] = mapped_column(Time, default=time(23, 0))

    focus_minutes: Mapped[int] = mapped_column(default=40, server_default="40")
    break_minutes: Mapped[int] = mapped_column(default=5, server_default="5")

    # Overruns don't count as a failed session while this is on
    flexible_timers: Mapped[bool] = mapped_column(default=True, server_default="true")

    # Only a sync target for new devices. Client first paints from localStorage
    theme: Mapped[Theme] = mapped_column(
        Enum(Theme, name="theme"),
        default=Theme.light,
        server_default="light",
    )

    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(),
        onupdate=func.now(),
    )