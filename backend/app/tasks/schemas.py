import uuid
from enum import StrEnum
from datetime import datetime
from pydantic import BaseModel, ConfigDict

from app.tasks.models import TaskStatus, EnergyTag


class TaskView(StrEnum):
    today = "today"
    incomplete = "incomplete"
    in_progress = "in_progress"
    done = "done"

class MicroStep(BaseModel):
    text: str
    done: bool = False

class TaskCreate(BaseModel):
    title: str
    description: str | None = None
    energy_tag: EnergyTag | None = None
    estimate_minutes: int
    category_id: uuid.UUID | None = None
    micro_steps: list[MicroStep] = []

class TaskUpdate(BaseModel):
    # No status field: completion goes through /tasks/{id}/done and in_progress
    # is set by timeblock linking, so there is one way to change each status.
    # extra="forbid" so a client still sending status gets a 422 instead of a
    # silent no-op that looks like a successful tick.
    model_config = ConfigDict(extra="forbid")

    title: str | None = None
    description: str | None = None
    energy_tag: EnergyTag | None = None
    estimate_minutes: int | None = None
    actual_minutes: int | None = None
    category_id: uuid.UUID | None = None
    micro_steps: list[MicroStep] | None = None

class TaskRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    description: str | None
    energy_tag: EnergyTag | None
    estimate_minutes: int
    actual_minutes: int | None
    category_id: uuid.UUID | None
    status: TaskStatus
    micro_steps: list[MicroStep]
    created_at: datetime
    completed_at: datetime | None
