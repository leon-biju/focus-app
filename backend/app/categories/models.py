from enum import StrEnum
import uuid
from datetime import datetime

from sqlalchemy import Enum, ForeignKey, Index, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class CategoryType(StrEnum):
    task = "task"
    time_block = "time_block"


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid7)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))

    label: Mapped[str] = mapped_column(Text)
    color: Mapped[str] = mapped_column(Text)
    type: Mapped[CategoryType] = mapped_column(
        Enum(CategoryType, name="category_type"),
    )

    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    version_id: Mapped[int] = mapped_column(server_default="1")

    __mapper_args__ = {"version_id_col": version_id}

    __table_args__ = (
        Index("ix_categories_user_type", "user_id", "type"),
    )
