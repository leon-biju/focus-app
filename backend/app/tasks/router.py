from typing import List
import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db, get_day_context, DayContext
from app.auth.models import User
from app.tasks.schemas import TaskCreate, TaskRead, TaskUpdate, TaskView
import app.tasks.services as task_services

router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_task(
    payload: TaskCreate,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
) -> TaskRead:
    task = await task_services.create(session, payload, user.id)
    
    return task

@router.get("")
async def list_tasks(
    view: TaskView = Query(),
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    day: DayContext = Depends(get_day_context),
) -> List[TaskRead]:
    tasks = await task_services.list_tasks(
        session, user.id, view, day if view == TaskView.today else None,
    )
    return tasks


@router.get("/{task_id}")
async def get_task(
    task_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
) -> TaskRead:
    task = await task_services.get(session, task_id, user.id)    
    return task


@router.patch("/{task_id}")
async def update_task(
    task_id: uuid.UUID,
    payload: TaskUpdate,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
) -> TaskRead:
    task = await task_services.update(session, payload, task_id, user.id)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    await task_services.delete(session, task_id, user.id)


# The justification behind having a seperate endpoint for setting status is so that the timestamp is guaranteed to have
# been set/unset

@router.post("/{task_id}/done")
async def complete_task(
    task_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
) -> TaskRead:
    task = await task_services.complete(session, task_id, user.id)
    return task


@router.delete("/{task_id}/done")
async def uncomplete_task(
    task_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
) -> TaskRead:
    task = await task_services.uncomplete(session, task_id, user.id)
    return task
