from abc import ABC, abstractmethod
from typing import AsyncIterable
from uuid import UUID


class StorageProvider(ABC):
    """Abstract base class for storage providers (Local, S3, etc.)."""

    CHUNK_SIZE = 1024 * 1024  # 1 MB chunk for streaming

    @classmethod
    @abstractmethod
    async def save_file(cls, file_id: UUID, stream: AsyncIterable[bytes]):
        """Persists a file stream to the storage medium."""
        ...

    @classmethod
    @abstractmethod
    def delete_file(cls, file_id: UUID):
        """Removes a file from the storage medium by ID."""
        ...

    @classmethod
    @abstractmethod
    def ensure_dir(cls, path: str) -> None:
        """Ensures the destination directory structure exists."""
        ...
