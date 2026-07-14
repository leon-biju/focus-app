from typing import Dict, List, Any
from enum import StrEnum
import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, func, Text, JSON, Enum
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.ext.mutable import MutableList

from app.db import Base

class TaskStatus(StrEnum):
    not_started = "not_started"
    in_progress = "in_progress"
    done = "done"

class EnergyTag(StrEnum):
    low = "low"
    medium = "medium"
    high = "high"


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid7)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(Text)
    description: Mapped[str | None] = mapped_column(Text)
    
    estimate_minutes: Mapped[int]
    actual_minutes: Mapped[int | None]

    energy_tag: Mapped[EnergyTag | None] = mapped_column(
        Enum(EnergyTag, name="energy_tag"),
    )
    status: Mapped[TaskStatus] = mapped_column(
        Enum(TaskStatus, name="task_status"),
        default=TaskStatus.not_started
    )

    micro_steps: Mapped[List[Dict[str, Any]]] = mapped_column(
        MutableList.as_mutable(JSON),
        default=list
    )

    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    completed_at: Mapped[datetime | None]