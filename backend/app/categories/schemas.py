import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.categories.models import CategoryType


class CategoryCreate(BaseModel):
    label: str
    color: str
    type: CategoryType


class CategoryUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    label: str | None = None
    color: str | None = None


class CategoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    label: str
    color: str
    type: CategoryType
    created_at: datetime
