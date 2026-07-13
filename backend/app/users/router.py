from fastapi import APIRouter, Depends, HTTPException, status

from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.users.schemas import UserCreate, UserRead, LoginRequest, Token
from app.users.services import register_user, UserAlreadyExistsError, authenticate_user
from app.core.security import create_access_token
from app.core.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register")
async def register(payload: UserCreate, session: AsyncSession = Depends(get_db)) -> UserRead:
    try:
        user = await register_user(session, payload.email, payload.password)
    except UserAlreadyExistsError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists."
        )
    
    return user


@router.post("/login")
async def login(payload: LoginRequest, session: AsyncSession = Depends(get_db)) -> Token:
    user = await authenticate_user(session, payload.email, payload.password)
    if user is None: 
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid credentials."
        )
    token = create_access_token(user.id)
    return Token(access_token=token)


@router.get("/me")
async def me(user = Depends(get_current_user)) -> UserRead:
    return user