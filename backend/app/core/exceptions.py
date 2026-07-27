class AppError(Exception):
    status_code: int = 500
    detail: str = "Internal server error."

    def __init__(self, detail: str | None = None):
        if detail:
            self.detail = detail
        # Without this the subclass default never reaches args, so str(exc) is ""
        # and tracebacks show a bare class name with no message.
        super().__init__(self.detail)
