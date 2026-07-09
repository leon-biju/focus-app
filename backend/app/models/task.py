import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, func, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[uuid.UUID]                 = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID]            = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str]                    = mapped_column(Text)
    description: Mapped[str | None]       = mapped_column(Text)
    energy_tag: Mapped[str | None]
    estimate_minutes: Mapped[int | None]
    actual_minutes: Mapped[int | None]
    status: Mapped[str]                   = mapped_column(default="pending")

    created_at: Mapped[datetime]          = mapped_column(server_default=func.now())
    completed_at: Mapped[datetime | None]