from app.core.exceptions import AppError

class NoteNotFoundError(AppError):
    status_code = 404
    detail = "Note not found."

class NoteConflictError(AppError):
    status_code = 409
    detail = "Note was modified elsewhere. Reload before saving."