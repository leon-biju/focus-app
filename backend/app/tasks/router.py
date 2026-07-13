from typing import List
import uuid
from fastapi import APIRouter, Depends, HTTPException, status

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db

from app.users.models import User
from app.tasks.schemas import TaskCreate, TaskRead, TaskUpdate
from app.tasks.services import create_task, update_task, TaskNotFoundException, get_user_tasks

router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.post("/create")
async def create(
    payload: TaskCreate,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
) -> TaskRead:
    
    task = await create_task(session, payload, user.id)
    
    return task


@router.patch("/update/{task_id}")
async def update(
    task_id: uuid.UUID,
    payload: TaskUpdate,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
) -> TaskRead:
    try:
        task = await update_task(session, payload, task_id, user.id)
    except TaskNotFoundException:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Task not found.")
    
    return task


# This is a temporary and should be replaced with a nice well oiled filter type
@router.get("/my_tasks")
async def gettasks(
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
) -> List[TaskRead]:
    tasks = await get_user_tasks(session, user.id)

    return tasks