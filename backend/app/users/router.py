from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.core.deps import get_current_user, get_db
from app.users.schemas import (
    UserMeRead,
    UserProfileRead,
    UserProfileUpdate,
    UserSettingsRead,
    UserSettingsUpdate,
)
import app.users.services as users_services

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me")
async def get_me(
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> UserMeRead:
    settings = await users_services.get_settings(session, user.id)

    return UserMeRead(
        profile=UserProfileRead.model_validate(user),
        settings=UserSettingsRead.model_validate(settings),
    )


@router.patch("/me")
async def update_me(
    payload: UserProfileUpdate,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> UserProfileRead:
    user = await users_services.update_profile(session, payload, user)

    return user


@router.get("/me/settings")
async def get_my_settings(
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> UserSettingsRead:
    settings = await users_services.get_settings(session, user.id)

    return settings


@router.patch("/me/settings")
async def update_my_settings(
    payload: UserSettingsUpdate,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> UserSettingsRead:
    settings = await users_services.update_settings(session, payload, user.id)

    return settings
