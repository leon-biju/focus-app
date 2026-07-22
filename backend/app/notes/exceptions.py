from app.core.exceptions import AppException

class NoteNotFoundException(AppException):
    status_code = 404
    detail = "Note not found."

class NoteConflictException(AppException):
    status_code = 409
    detail = "Note was modified elsewhere. Reload before saving."