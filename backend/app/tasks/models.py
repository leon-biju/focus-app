from typing import Dict, List, Any
from enum import StrEnum
import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, func, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.ext.mutable import MutableList

from app.db import Base

class TaskStatus(StrEnum):
    NOT_STARTED = "not started"
    IN_PROGRESS = "in progress"
    DONE = "done"

class EnergyTag(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid7)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(Text)
    description: Mapped[str | None] = mapped_column(Text)
    energy_tag: Mapped[EnergyTag | None]
    estimate_minutes: Mapped[int]
    actual_minutes: Mapped[int | None]
    status: Mapped[TaskStatus] = mapped_column(default=TaskStatus.NOT_STARTED)
    micro_steps: Mapped[List[Dict[str, Any]]] = mapped_column(
        MutableList.as_mutable(JSON),
        default=list
    )

    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    completed_at: Mapped[datetime | None]