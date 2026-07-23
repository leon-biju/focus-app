from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from fastapi.responses import JSONResponse

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db import get_db
from app.users.schemas import UserCreate, UserRead, LoginRequest, Token
from app.users.services import (
    authenticate_user,
    issue_refresh_token,
    register_user,
    revoke_refresh_token,
    rotate_refresh_token,
)
from app.users.exceptions import InvalidRefreshTokenError
from app.core.security import create_access_token
from app.core.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

REFRESH_COOKIE = "refresh_token"

# Where the cookie can actually be read from
REFRESH_COOKIE_PATH = "/api/auth"


# Two helper functions just to clear and set cookies
def set_refresh_cookie(response: Response, token: str):
    response.set_cookie(
        key=REFRESH_COOKIE,
        value=token,
        httponly=True,
        samesite="lax",
        secure=settings.cookie_secure,
        path=REFRESH_COOKIE_PATH,
        max_age=settings.refresh_token_expire_days * 86400,
    )

def clear_refresh_cookie(response: Response):
    # Must use the exact same path and attributes for the browser to clear it
    response.delete_cookie(
        key=REFRESH_COOKIE,
        httponly=True,
        samesite="lax",
        secure=settings.cookie_secure,
        path=REFRESH_COOKIE_PATH,
    )


@router.post("/register")
async def register(payload: UserCreate, session: AsyncSession = Depends(get_db)) -> UserRead:
    user = await register_user(session, payload.email, payload.password)

    return user


@router.post("/login")
async def login(
    payload: LoginRequest,
    response: Response,
    session: AsyncSession = Depends(get_db),
) -> Token:
    user = await authenticate_user(session, payload.email, payload.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials."
        )
    refresh_token = await issue_refresh_token(session, user.id)

    set_refresh_cookie(response, refresh_token)

    token = create_access_token(user.id)
    return Token(access_token=token)


@router.post("/refresh")
async def refresh(
    response: Response,
    refresh_token: str | None = Cookie(default=None),
    session: AsyncSession = Depends(get_db),
) -> Token:
    # Don't need to get_current_user here, since the caller may be calling with an 
    # expired access_token. So only look at the refresh_token cookie
    if refresh_token is not None:
        try:
            user_id, new_refresh_token = await rotate_refresh_token(session, refresh_token)
            
            # This is a successful refresh and we send back the new access_token
            set_refresh_cookie(response, new_refresh_token)
            return Token(access_token=create_access_token(user_id))
        except InvalidRefreshTokenError:
            pass
        

    # HTTPException wouldn't carry cookie mutations made on the injected
    # Response, so build the 401 directly and clear the cookie on it.
    error = JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={"detail": "Invalid refresh token."},
    )
    clear_refresh_cookie(error)
    return error


@router.post("/logout")
async def logout(
    response: Response,
    refresh_token: str | None = Cookie(default=None),
    session: AsyncSession = Depends(get_db),
):

    # Just revoke the cookie can't do much about the access token just hope no
    # adversary uses it before it expires

    # Missing/invalid cookie is ok so this is idempotent as well
    if refresh_token is not None:
        await revoke_refresh_token(session, refresh_token)
    clear_refresh_cookie(response)

    return Response(status_code = status.HTTP_204_NO_CONTENT)


@router.get("/me")
async def me(user = Depends(get_current_user)) -> UserRead:
    return user