from datetime import datetime

from sqlalchemy import DateTime
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase


from app.config import settings

engine = create_async_engine(settings.database_url)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)

class Base(DeclarativeBase):
    # Every Mapped[datetime] anywhere in the app is TIMESTAMPTZ, so the DB stores
    # UTC and the API always serialises an offset. The backend never reasons about
    # local time; clients convert for display. Anything day-boundary shaped (what
    # counts as "today") belongs in the user's cutoff setting, not in here.
    type_annotation_map = {datetime: DateTime(timezone=True)}

async def get_db():
    async with SessionLocal() as session:
        yield session