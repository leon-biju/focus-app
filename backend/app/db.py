from datetime import datetime

from fastapi import Request
from sqlalchemy import DateTime, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
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

async def db_session_middleware(request: Request, call_next):
    # One session, therefore one transaction, per request
    # Middleware so that this session guaranteed dies before the response is sent
    # That way any writes can be made before we send out the response

    async with SessionLocal() as session:
        request.state.db = session

        response = await call_next(request)

        # Without this check a 409 or a 422 would commit the
        # partial writes it was raised to prevent.
        if response.status_code < 400:
            await session.commit()
        else:
            await session.rollback()

        return response


async def get_db(request: Request) -> AsyncSession:
    return request.state.db

async def ping_db():
    # Test that the db connection actually works before we attempt to 
    # serve the api
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))