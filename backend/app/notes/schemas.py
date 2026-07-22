import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class NoteCreate(BaseModel):
    content: str

class NoteUpdate(BaseModel):
    content: str

    # The version_id the client last read
    version_id: int

class NoteRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    content: str
    created_at: datetime
    version_id: int