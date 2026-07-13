from typing import List
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.tasks import TaskCreate, TaskUpdate
from app.models import Task

async def create_task(
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

class TaskNotFoundException(Exception):
    pass

async def update_task(
    session: AsyncSession,
    payload: TaskUpdate,
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
    
    task_updates = payload.model_dump(exclude_unset=True)

    for key, val in task_updates.items():
        setattr(task, key, val)

    await session.commit()
    await session.refresh(task)


    return task


async def get_user_tasks(
    session: AsyncSession,
    user_id: uuid.UUID
) -> List[Task]:
    
    result = await session.execute(
        select(Task)
        .where(Task.user_id == user_id)
    )

    return list(result.scalars().all())