class FileNotFoundError(Exception):
    """Raised when a requested file does not exist."""

    def __init__(self, message: str = "File not found"):
        super().__init__(message)


class FileRecordNotFoundError(Exception):
    """Raised when a requested file record does not exist in the database."""

    def __init__(self, message: str = "File record not found"):
        super().__init__(message)
