from app.core.exceptions import AppError

class UserAlreadyExistsError(AppError):
    status_code = 409
    detail = "A user with this email already exists."

class InvalidRefreshTokenError(AppError):
    status_code = 401
    detail = "Invalid refresh token."