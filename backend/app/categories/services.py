from typing import List
import uuid

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm.exc import StaleDataError

from app.categories.schemas import CategoryCreate, CategoryUpdate
from app.categories.models import Category, CategoryType
from app.categories.exceptions import CategoryNotFoundError, CategoryConflictError

from app.tasks.models import Task
from app.time_blocks.models import TimeBlock


async def create(
    session: AsyncSession,
    payload: CategoryCreate,
    user_id: uuid.UUID,
) -> Category:
    category = Category(
        user_id=user_id,
        **payload.model_dump(),
    )
    session.add(category)
    await session.flush()

    return category


async def get(
    session: AsyncSession,
    category_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Category:
    result = await session.execute(
        select(Category)
        .where(
            Category.id == category_id,
            Category.user_id == user_id,
        )
    )

    category = result.scalar_one_or_none()
    if category is None:
        raise CategoryNotFoundError()

    return category


async def list_categories(
    session: AsyncSession,
    user_id: uuid.UUID,
    type: CategoryType,
) -> List[Category]:
    result = await session.execute(
        select(Category)
        .where(
            Category.user_id == user_id,
            Category.type == type,
        )
    )

    return list(result.scalars().all())


async def update(
    session: AsyncSession,
    payload: CategoryUpdate,
    category_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Category:
    category = await get(session, category_id, user_id)

    updates = payload.model_dump(exclude_unset=True)
    for key, val in updates.items():
        setattr(category, key, val)

    try:
        await session.flush()
    except StaleDataError as e:
        raise CategoryConflictError() from e

    return category


async def delete(
    session: AsyncSession,
    category_id: uuid.UUID,
    user_id: uuid.UUID,
):
    category = await get(session, category_id, user_id)

    await session.delete(category)

    try:
        await session.flush()
    except StaleDataError as e:
        raise CategoryConflictError() from e


async def count_items(
    session: AsyncSession,
    category_id: uuid.UUID,
    user_id: uuid.UUID,
) -> int:
    # Just return a count of how many tasks/timeblocks use this

    category = await get(session, category_id, user_id)
    
    # I know this is verbose and can be done in one line i just want to add future flexibility
    match category.type:
        case CategoryType.task: cat_type = Task
        case CategoryType.time_block: cat_type = TimeBlock

    result = await session.execute(
        select(func.count())
        .select_from(cat_type)
        .where(cat_type.category_id == category_id)
    )
    return result.scalar_one()


async def list_items(
    session: AsyncSession,
    category_id: uuid.UUID,
    user_id: uuid.UUID,
) -> List[Task | TimeBlock]:
    # Return all of the tasks/timeblock

    category = await get(session, category_id, user_id)

    # I know this is verbose and can be done in one line i just want to add future flexibility
    match category.type:
        case CategoryType.task: cat_type = Task
        case CategoryType.time_block: cat_type = TimeBlock

    result = await session.execute(
        select(cat_type)
        .where(cat_type.category_id == category_id)
    )

    return list(result.scalars().all())