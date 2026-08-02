import uuid
from datetime import datetime
from pydantic import AwareDatetime, BaseModel, ConfigDict, model_validator

# AwareDatetime on the inbound fields so that we can have a timezone field

class TimeBlockCreate(BaseModel):
    title: str
    description: str | None = None
    start_at: AwareDatetime
    end_at: AwareDatetime
    task_id: uuid.UUID | None = None
    category_id: uuid.UUID | None = None

    @model_validator(mode="after")
    def end_after_start(self):
        if self.end_at <= self.start_at:
            raise ValueError("end_at must be after start_at")
        return self

class TimeBlockUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = None
    description: str | None = None
    start_at: AwareDatetime | None = None
    end_at: AwareDatetime | None = None
    task_id: uuid.UUID | None = None
    category_id: uuid.UUID | None = None

class TimeBlockRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    task_id: uuid.UUID | None
    title: str
    description: str | None = None
    category_id: uuid.UUID | None
    start_at: datetime
    end_at: datetime
    created_at: datetime
