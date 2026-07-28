from app.core.exceptions import AppError

class TimeBlockNotFoundError(AppError):
    status_code = 404
    detail = "Time block not found."

class TimeBlockConflictError(AppError):
    status_code = 409
    detail = "Time block was modified by another request. Try again."

class TimeBlockInvalidRangeError(AppError):
    status_code = 422
    detail = "A time block must end after it starts."
