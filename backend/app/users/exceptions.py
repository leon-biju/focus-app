from app.core.exceptions import AppError

class UserSettingsMissingError(AppError):
    # Not a 404 since the server should create this row during registration
    status_code = 500
    detail = "Server Error: User settings row is missing."
