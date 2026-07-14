from typing import List
import uuid
from fastapi import APIRouter, Depends, HTTPException, status

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db

from app.users.models import User
from app.tasks.schemas import TaskCreate, TaskRead, TaskUpdate
from app.tasks.exceptions import TaskNotFoundException
import app.tasks.services as task_services

router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.post("/")
async def create_task(
    payload: TaskCreate,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
) -> TaskRead:
    
    task = await task_services.create(session, payload, user.id)
    
    return task

@router.get("/")
async def list_tasks(
    
) -> List[TaskRead]:
    pass


@router.get("/{task_id}")
async def get_task(
    task_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
) -> TaskRead:
    tasks = await task_services.get(session, task_id, user.id)

    return tasks


@router.patch("/{task_id}")
async def update_task(
    task_id: uuid.UUID,
    payload: TaskUpdate,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
) -> TaskRead:
    try:
        task = await task_services.update_task(session, payload, task_id, user.id)
    except TaskNotFoundException:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Task not found.")
    
    return task


@router.delete("/{task_id}")
async def delete_task():
    pass


