import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, ForeignKey, Index, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class TimeBlock(Base):
    __tablename__ = "time_blocks"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid7)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))

    task_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("tasks.id", ondelete="SET NULL"), index=True)

    title: Mapped[str] = mapped_column(Text)

    # users can choose the category names and colours to their liking
    category_label: Mapped[str | None] = mapped_column(Text)
    category_color: Mapped[str | None] = mapped_column(Text)

    # UTC instants.
    # The logical day and time is converted to this at query time
    start_at: Mapped[datetime]
    end_at: Mapped[datetime]

    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    # Optimistic locking: every UPDATE/DELETE uses WHERE version_id = value read,
    # so a concurrent read-modify-write raises StaleDataError instead of going weird
    version_id: Mapped[int] = mapped_column(server_default="1")

    __mapper_args__ = {"version_id_col": version_id}

    __table_args__ = (
        # Every read is "this user, this day window", so the composite covers both
        # the range scan and a plain user_id lookup. No separate index on user_id.
        Index("ix_time_blocks_user_start", "user_id", "start_at"),

        CheckConstraint("end_at > start_at", name="ck_time_blocks_end_after_start"),
    )
