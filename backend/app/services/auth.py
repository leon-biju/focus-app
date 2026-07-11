from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select

from app.models import User
from app.core.security import hash_password, verify_password, DUMMY_HASH

class UserAlreadyExistsError(Exception):
    pass
 
async def register_user(session: AsyncSession, email: str, password: str) -> User:
    user = User(
        email=email.lower().strip(),
        password_hash=hash_password(password)
    )

    session.add(user)

    try:
        await session.commit()
    except IntegrityError as e:
        await session.rollback()
        raise UserAlreadyExistsError(email) from e
        
    await session.refresh(user)

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
    