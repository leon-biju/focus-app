from app.core.exceptions import AppException

class TaskNotFoundException(AppException):
    status_code = 404
    detail = "Task not found."
    
class TaskConflictException(AppException):
    status_code = 409
    detail = "Task was modified by another request. Try again."
