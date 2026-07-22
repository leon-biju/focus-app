import uuid
from datetime import datetime

from sqlalchemy import Text, func, ForeignKey
from sqlalchemy.orm import mapped_column, Mapped

from app.db import Base

class Note(Base):
    __tablename__ = "notes"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid7)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    content: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    # Optimistic locking. Clients send back the version_id they loaded, so an
    # edit built on a stale copy is rejected rather than silently overwriting
    version_id: Mapped[int] = mapped_column(server_default="1")

    __mapper_args__ = {"version_id_col": version_id}
