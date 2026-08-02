from app.core.exceptions import AppError


class CategoryNotFoundError(AppError):
    status_code = 404
    detail = "Category not found."


class CategoryConflictError(AppError):
    status_code = 409
    detail = "Category was modified by another request. Try again."
