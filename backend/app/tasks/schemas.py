import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict

from app.tasks.models import TaskStatus, EnergyTag

class MicroStep(BaseModel):
    text: str
    done: bool = False

class TaskCreate(BaseModel):
    title: str
    description: str | None = None
    energy_tag: EnergyTag | None = None
    estimate_minutes: int
    micro_steps: list[MicroStep] = []

class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    energy_tag: EnergyTag | None = None
    estimate_minutes: int | None = None
    actual_minutes: int | None = None
    status: TaskStatus | None = None
    micro_steps: list[MicroStep] | None = None

class TaskRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    description: str | None
    energy_tag: EnergyTag | None
    estimate_minutes: int
    actual_minutes: int | None
    status: TaskStatus
    micro_steps: list[MicroStep]
    created_at: datetime
    completed_at: datetime | None
