from typing import List
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.tasks.schemas import TaskCreate, TaskUpdate
from app.tasks.models import Task
from app.tasks.exceptions import TaskNotFoundException

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
        .where(Task.id == task_id and Task.user_id == user_id)
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

    await session.commit()
    await session.refresh(task)

    return task


async def delete() -> Task:
    pass


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