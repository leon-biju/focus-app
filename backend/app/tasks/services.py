from typing import List
import uuid
from datetime import UTC, datetime

from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm.exc import StaleDataError

from app.core.deps import DayContext
from app.tasks.schemas import TaskCreate, TaskUpdate, TaskView
from app.tasks.models import Task, TaskStatus
from app.tasks.exceptions import TaskNotFoundError, TaskConflictError

async def create(
    session: AsyncSession,
    task_create: TaskCreate, 
    user_id: uuid.UUID,
) -> Task:
    
    task = Task(
        user_id = user_id,
        **task_create.model_dump(),
    )
    session.add(task)
    await session.flush()

    return task


async def get(
    session: AsyncSession,
    task_id: uuid.UUID, 
    user_id: uuid.UUID,
) -> Task:
    result = await session.execute(
        select(Task)
        .where(
            Task.id == task_id,
            Task.user_id == user_id
        )
    )

    task = result.scalar_one_or_none()
    if task is None:
        raise TaskNotFoundError()
    
    return task


async def update(
    session: AsyncSession,
    payload: TaskUpdate,
    task_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Task:
    
    task = await get(session, task_id, user_id)

    task_updates = payload.model_dump(exclude_unset=True)
    for key, val in task_updates.items():
        setattr(task, key, val)

    try:
        await session.flush()
    except StaleDataError as e:
        # Someone else wrote this row between our read and our flush.
        # db_session_middleware rolls this back automatically.
        raise TaskConflictError() from e

    return task


async def complete(
    session: AsyncSession,
    task_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Task:

    task = await get(session, task_id, user_id)

    # Already completed tasks must not have the timestamp changed
    if task.status is not TaskStatus.done:
        task.status = TaskStatus.done
        task.completed_at = datetime.now(UTC)

        try:
            await session.flush()
        except StaleDataError as e:
            raise TaskConflictError() from e

    return task


async def uncomplete(
    session: AsyncSession,
    task_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Task:

    task = await get(session, task_id, user_id)

    if task.status is TaskStatus.done:
        # TODO: Once timeblocks are implemented add a check here to see if progress to 'incomplete' or 'not_started'
        task.status = TaskStatus.not_started
        task.completed_at = None

        try:
            await session.flush()
        except StaleDataError as e:
            raise TaskConflictError() from e

    return task


async def delete(
    session: AsyncSession,
    task_id: uuid.UUID,
    user_id: uuid.UUID,
):
    task = await get(session, task_id, user_id)

    await session.delete(task)

    try:
        await session.flush()
    except StaleDataError as e:
        raise TaskConflictError() from e
    



async def list_tasks(
    session: AsyncSession,
    user_id: uuid.UUID,
    view: TaskView,
    day: DayContext | None = None,
) -> List[Task]:
    query = select(Task).where(Task.user_id == user_id)

    match view:
        case TaskView.today:
            assert day is not None
            query = query.where(
                or_(
                    Task.status != TaskStatus.done,
                    Task.completed_at >= day.prev_start,
                ),
            )
        case TaskView.incomplete:
            query = query.where(Task.status != TaskStatus.done)
        case TaskView.in_progress:
            query = query.where(Task.status == TaskStatus.in_progress)
        case TaskView.done:
            query = query.where(Task.status == TaskStatus.done)


    result = await session.execute(query)
    return list(result.scalars().all())