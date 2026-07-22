from typing import List
import uuid
from datetime import date, timedelta

from sqlalchemy import select, and_, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm.exc import StaleDataError

from app.tasks.schemas import TaskCreate, TaskUpdate, TaskStatus
from app.tasks.models import Task
from app.tasks.exceptions import TaskNotFoundException, TaskConflictException

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
    await session.commit()
    await session.refresh(task)

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
        raise TaskNotFoundException()
    
    return task


async def filter_by() -> List[Task]:
    pass


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
        await session.commit()
    except StaleDataError:
        # Someone else wrote this row between our read and our commit.
        # Roll back so the session is reusable, then let the router 409.
        await session.rollback()
        raise TaskConflictException()

    await session.refresh(task)

    return task


async def delete(
    session: AsyncSession,
    task_id: uuid.UUID,
    user_id: uuid.UUID,
):
    task = await get(session, task_id, user_id)

    await session.delete(task)

    try:
        await session.commit()
    except StaleDataError:
        await session.rollback()
        raise TaskConflictException()
    



#lol get rid of this replace with filter_by
async def get_user_tasks(
    session: AsyncSession,
    user_id: uuid.UUID
) -> List[Task]:
    
    result = await session.execute(
        select(Task)
        .where(Task.user_id == user_id)
    )

    return list(result.scalars().all())




# Used by the dashboard etc. just all incomplete tasks and tasks that have been completed today
async def get_today_tasks(
    session: AsyncSession,
    user_id: uuid.UUID
) -> List[Task]:
    #TODO: Remember to update with user's preferred day cuttoff time! once that is done    
    today = date.today()

    result = await session.execute(
        select(Task)
        .where(
            Task.user_id == user_id
            , or_(
                Task.status == TaskStatus.done,
                func.date(Task.completed_at) == today
            )
        )
    )

    return list(result.scalars())