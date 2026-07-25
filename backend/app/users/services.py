import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.users.exceptions import UserSettingsMissingError
from app.users.models import UserSettings
from app.users.schemas import UserProfileUpdate, UserSettingsUpdate


async def create_default_settings(
    session: AsyncSession,
    user_id: uuid.UUID,
) -> UserSettings:
    # Called from register_user in the same transaction so not possible for a user to exist without settings
    settings = UserSettings(user_id=user_id)
    session.add(settings)
    await session.flush()

    return settings


async def get_settings(
    session: AsyncSession,
    user_id: uuid.UUID,
) -> UserSettings:
    settings = await session.get(UserSettings, user_id)

    if settings is None:
        # It should be here but if not that's a server mistake
        raise UserSettingsMissingError()

    return settings


async def update_settings(
    session: AsyncSession,
    payload: UserSettingsUpdate,
    user_id: uuid.UUID,
) -> UserSettings:
    settings = await get_settings(session, user_id)

    changes = payload.model_dump(exclude_unset=True, exclude_none=True)
    for field, value in changes.items():
        setattr(settings, field, value)

    await session.flush()

    return settings


async def update_profile(
    session: AsyncSession,
    payload: UserProfileUpdate,
    user: User,
) -> User:
    # No exclude_none since display_name can be null
    changes = payload.model_dump(exclude_unset=True)
    for field, value in changes.items():
        setattr(user, field, value)

    await session.flush()

    return user
