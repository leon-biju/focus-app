from datetime import datetime

from sqlalchemy import DateTime, text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
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
    # Every time this dependency is injected it counts as 1 transaction
    # Therefore multiple service calls using the same session will be commited at once
    # Easy to rollback etc.
    async with SessionLocal() as session:
        yield session
        await session.commit()

async def ping_db():
    # Test that the db connection actually works before we attempt to 
    # serve the api
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))