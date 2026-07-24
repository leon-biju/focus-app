import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from sqlalchemy import delete, select, update

from app.config import settings
from app.auth.models import RefreshToken, User
from app.auth.exceptions import UserAlreadyExistsError, InvalidRefreshTokenError
from app.core.security import (
    DUMMY_HASH,
    generate_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
 
async def register_user(session: AsyncSession, email: str, password: str) -> User:
    user = User(
        email=email.lower().strip(),
        password_hash=hash_password(password)
    )

    session.add(user)

    try:
        await session.flush()
    except IntegrityError as e:
        # get_db rolls back once this propagates out of the handler.
        raise UserAlreadyExistsError(email) from e

    return user

async def authenticate_user(session: AsyncSession, email: str, password: str) -> User | None:
    result = await session.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user is None:
        verify_password(password, DUMMY_HASH) # Just time-wasting here so we are more protected against timing attacks that would reveal if a user exists or not
        return None
    
    if not verify_password(password, user.password_hash):
        return None

    return user


async def issue_refresh_token(
    session: AsyncSession,
    user_id: uuid.UUID,
    family_id: uuid.UUID | None = None,
) -> str:
    # Creates a new refresh token row and returns the raw token
    # if family id is None then that means a new family so new device login


    now = datetime.now(timezone.utc)

    if family_id is None:
        # This is a new login so we can clean up the user's long-expired tokesn.
        # 7-day grace period for expired tokens so they won't just say "not found" but "expired"
        await session.execute(
            delete(RefreshToken).where(
                RefreshToken.user_id == user_id,
                RefreshToken.expires_at < now - timedelta(days=7),
            )
        )
        family_id = uuid.uuid4()

    raw_token = generate_refresh_token()
    session.add(
        RefreshToken(
            user_id=user_id,
            family_id=family_id,
            token_hash=hash_refresh_token(raw_token),
            expires_at=now + timedelta(days=settings.refresh_token_expire_days),
        )
    )

    return raw_token


async def rotate_refresh_token(session: AsyncSession, raw_token: str) -> tuple[uuid.UUID, str]:
    # Rotate a refresh token by issuing a new one and invalidating the old one
    # Return (user_uuid, new_raw_refresh_token)

    now = datetime.now(timezone.utc)

    result = await session.execute(
        select(RefreshToken)
        .where(RefreshToken.token_hash == hash_refresh_token(raw_token))
        .with_for_update()  # protect concurrent refreshes of the same token
    )
    token = result.scalar_one_or_none()

    if token is None:
        raise InvalidRefreshTokenError()

    if token.revoked_at is not None:
        # Token has been revoked already so we revoke all of this family's token for
        # security reasons
        await session.execute(
            update(RefreshToken)
            .where(
                RefreshToken.family_id == token.family_id,
                RefreshToken.revoked_at.is_(None),
            )
            .values(revoked_at=now)
        )

        # Commit explicitly here since the write MUST happen.
        # The raise will cause a rollback on the transaction
        await session.commit()
        raise InvalidRefreshTokenError()

    if token.expires_at < now:
        token.revoked_at = now
        # Same as above, the revocation must outlive the failing request.
        await session.commit()
        raise InvalidRefreshTokenError()

    token.revoked_at = now
    new_raw_token = await issue_refresh_token(session, token.user_id, family_id=token.family_id)

    return token.user_id, new_raw_token


async def revoke_refresh_token(session: AsyncSession, raw_token: str):
    # Revoke just the presented token. Used when logging out and is idempotent
    result = await session.execute(
        select(RefreshToken).where(
            RefreshToken.token_hash == hash_refresh_token(raw_token)
        )
    )
    token = result.scalar_one_or_none()

    if token is not None and token.revoked_at is None:
        token.revoked_at = datetime.now(timezone.utc)
