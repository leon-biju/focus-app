from app.core.exceptions import AppException

class UserAlreadyExistsError(AppException):
    status_code = 409
    detail = "A user with this email already exists."

class InvalidRefreshTokenError(AppException):
    status_code = 401
    detail = "Invalid refresh token."