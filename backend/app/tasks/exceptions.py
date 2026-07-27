from app.core.exceptions import AppError

class TaskNotFoundError(AppError):
    status_code = 404
    detail = "Task not found."
    
class TaskConflictError(AppError):
    status_code = 409
    detail = "Task was modified by another request. Try again."
