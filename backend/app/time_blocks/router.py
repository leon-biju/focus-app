from typing import List
import uuid
from datetime import date

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db, get_day_context, DayContext
from app.auth.models import User
from app.time_blocks.schemas import TimeBlockCreate, TimeBlockRead, TimeBlockUpdate
import app.time_blocks.services as time_block_services

router = APIRouter(prefix="/time-blocks", tags=["time-blocks"])

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_time_block(
    payload: TimeBlockCreate,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
) -> TimeBlockRead:
    time_block = await time_block_services.create(session, payload, user.id)

    return time_block


@router.get("")
async def list_time_blocks(
    on: date | None = Query(None, alias="date"),
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    day: DayContext = Depends(get_day_context)
) -> List[TimeBlockRead]:
    time_blocks = await time_block_services.get_day_blocks(session, user.id, day, on)

    return time_blocks


@router.get("/{time_block_id}")
async def get_time_block(
    time_block_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
) -> TimeBlockRead:
    time_block = await time_block_services.get(session, time_block_id, user.id)
    return time_block


# Drag-to-move and dialog edits both land here
@router.patch("/{time_block_id}")
async def update_time_block(
    time_block_id: uuid.UUID,
    payload: TimeBlockUpdate,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
) -> TimeBlockRead:
    time_block = await time_block_services.update(session, payload, time_block_id, user.id)
    return time_block


@router.delete("/{time_block_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_time_block(
    time_block_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    await time_block_services.delete(session, time_block_id, user.id)
