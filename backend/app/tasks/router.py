from typing import List
import uuid

from fastapi import APIRouter, Depends, status, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db, get_day_context, DayContext
from app.auth.models import User
from app.tasks.schemas import TaskCreate, TaskRead, TaskUpdate
import app.tasks.services as task_services

router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.post("")
async def create_task(
    payload: TaskCreate,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
) -> TaskRead:
    task = await task_services.create(session, payload, user.id)
    
    return task

@router.get("")
async def list_tasks(
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)

) -> List[TaskRead]:
    
    # temporary function just to get all tasks 
    # In future get query paramters in here as well!
    tasks = await task_services.get_user_tasks(session, user.id)
    
    return tasks


@router.get("/today")
async def todays_tasks(
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    day: DayContext = Depends(get_day_context)
) -> List[TaskRead]:
    tasks = await task_services.get_today_tasks(session, user.id, day)
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


@router.delete("/{task_id}")
async def delete_task(
    task_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    await task_services.delete(session, task_id, user.id)
    return Response(status_code = status.HTTP_204_NO_CONTENT)


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
