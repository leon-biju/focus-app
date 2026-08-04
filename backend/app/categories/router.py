from typing import List, Dict
import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db
from app.auth.models import User
from app.categories.schemas import CategoryCreate, CategoryRead, CategoryUpdate
from app.categories.models import CategoryType
import app.categories.services as category_services

from app.tasks.schemas import TaskRead
from app.time_blocks.schemas import TimeBlockRead

router = APIRouter(prefix="/categories", tags=["categories"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_category(
    payload: CategoryCreate,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> CategoryRead:
    category = await category_services.create(session, payload, user.id)
    return category


@router.get("")
async def list_categories(
    type: CategoryType = Query(),
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> List[CategoryRead]:
    categories = await category_services.list_categories(session, user.id, type)
    return categories


@router.get("/{category_id}")
async def get_category(
    category_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> CategoryRead:
    category = await category_services.get(session, category_id, user.id)
    return category


@router.patch("/{category_id}")
async def update_category(
    category_id: uuid.UUID,
    payload: CategoryUpdate,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> CategoryRead:
    category = await category_services.update(session, payload, category_id, user.id)
    return category


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await category_services.delete(session, category_id, user.id)


@router.get("/{category_id}/items")
async def list_category_items(
    category_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> List[TaskRead | TimeBlockRead]:
    items = await category_services.list_items(session, category_id, user.id)
    return items


@router.get("/{category_id}/items/count")
async def count_category_items(
    category_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Dict[str, int]:
    count = await category_services.count_items(session, category_id, user.id)
    return {"count": count}