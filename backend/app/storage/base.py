from abc import ABC, abstractmethod
from typing import AsyncIterable
from uuid import UUID


class StorageProvider(ABC):
    CHUNK_SIZE = 1024 * 1024  # 1 MB

    @classmethod
    @abstractmethod
    async def save_file(cls, file_id: UUID, stream: AsyncIterable[bytes]): ...

    @classmethod
    @abstractmethod
    def delete_file(cls, file_id: UUID): ...

    @classmethod
    @abstractmethod
    def ensure_dir(cls, path: str) -> None: ...
