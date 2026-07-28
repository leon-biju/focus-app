from typing import List
import uuid
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm.exc import StaleDataError

from app.core.deps import DayContext
from app.tasks.models import TaskStatus
import app.tasks.services as task_services
from app.time_blocks.schemas import TimeBlockCreate, TimeBlockUpdate
from app.time_blocks.models import TimeBlock
from app.time_blocks.exceptions import (
    TimeBlockNotFoundError,
    TimeBlockConflictError,
    TimeBlockInvalidRangeError,
)


async def _start_linked_task(
    session: AsyncSession,
    task_id: uuid.UUID,
    user_id: uuid.UUID,
):
    task = await task_services.get(session, task_id, user_id)

    # Only not_started tasks should be set to in prog
    if task.status is TaskStatus.not_started:
        task.status = TaskStatus.in_progress


async def create(
    session: AsyncSession,
    payload: TimeBlockCreate,
    user_id: uuid.UUID,
) -> TimeBlock:

    if payload.task_id is not None:
        await _start_linked_task(session, payload.task_id, user_id)

    time_block = TimeBlock(
        user_id = user_id,
        **payload.model_dump(),
    )
    session.add(time_block)
    await session.flush()

    return time_block


async def get(
    session: AsyncSession,
    time_block_id: uuid.UUID,
    user_id: uuid.UUID,
) -> TimeBlock:
    result = await session.execute(
        select(TimeBlock)
        .where(
            TimeBlock.id == time_block_id,
            TimeBlock.user_id == user_id
        )
    )

    time_block = result.scalar_one_or_none()
    if time_block is None:
        raise TimeBlockNotFoundError()

    return time_block


# A block belongs to the day it starts in
async def get_day_blocks(
    session: AsyncSession,
    user_id: uuid.UUID,
    day: DayContext,
    on: date | None = None,
) -> List[TimeBlock]:
    start, end = day.window_for(on)

    result = await session.execute(
        select(TimeBlock)
        .where(
            TimeBlock.user_id == user_id,
            TimeBlock.start_at >= start,
            TimeBlock.start_at < end,
        )
        .order_by(TimeBlock.start_at)
    )

    return list(result.scalars())


async def update(
    session: AsyncSession,
    payload: TimeBlockUpdate,
    time_block_id: uuid.UUID,
    user_id: uuid.UUID,
) -> TimeBlock:

    time_block = await get(session, time_block_id, user_id)

    updates = payload.model_dump(exclude_unset=True)

    new_task_id = updates.get("task_id")
    if new_task_id is not None and new_task_id != time_block.task_id:
        await _start_linked_task(session, new_task_id, user_id)

    for key, val in updates.items():
        setattr(time_block, key, val)

    # A PATCH might only send one part which pydantic obv can't catch so just check here
    if time_block.end_at <= time_block.start_at:
        raise TimeBlockInvalidRangeError()

    try:
        await session.flush()
    except StaleDataError as e:
        # Someone else wrote this row between our read and our flush.
        # db_session_middleware rolls this back automatically.
        raise TimeBlockConflictError() from e

    return time_block


async def delete(
    session: AsyncSession,
    time_block_id: uuid.UUID,
    user_id: uuid.UUID,
):
    time_block = await get(session, time_block_id, user_id)

    await session.delete(time_block)

    try:
        await session.flush()
    except StaleDataError as e:
        raise TimeBlockConflictError() from e
