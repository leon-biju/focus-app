import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base

class User(Base):
   __tablename__ = "users"

   id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
   email: Mapped[str] = mapped_column(unique=True, index=True)
   password_hash: Mapped[str]
   created_at: Mapped[datetime] = mapped_column(server_default=func.now())


class RefreshToken(Base):
   __tablename__ = "refresh_tokens"

   id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
   user_id: Mapped[uuid.UUID] = mapped_column(
      ForeignKey("users.id", ondelete="CASCADE"), index=True
   )
   # All tokens in one rotation chain (so per user device/browser session) share a family_id
   # Any reuse of a revoked refresh token will revoke the whole family.
   family_id: Mapped[uuid.UUID] = mapped_column(index=True)
   token_hash: Mapped[str] = mapped_column(unique=True, index=True)  # sha256 hex
   created_at: Mapped[datetime] = mapped_column(
      DateTime(timezone=True), server_default=func.now()
   )
   expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
   # Set when superseded by rotation, revoked by logout, or family-revoked.
   revoked_at: Mapped[datetime | None] = mapped_column(
      DateTime(timezone=True), default=None
   )