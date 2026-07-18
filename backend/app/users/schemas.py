from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.config import settings

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

class UserRead(BaseModel):
    email: EmailStr
    created_at: datetime

    model_config = {"from_attributes": True}

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_sec: int = settings.access_token_expire_minutes * 60

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
