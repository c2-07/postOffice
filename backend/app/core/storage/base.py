from abc import ABC, abstractmethod
from typing import AsyncIterable, AsyncGenerator


class BaseStorage(ABC):
    @abstractmethod
    def save(self, path: str, stream: AsyncIterable[bytes]): ...

    @abstractmethod
    def get_file(self, path: str): ...

    @abstractmethod
    def get_stream(self, path: str) -> AsyncGenerator[bytes, None]: ...

    @abstractmethod
    def remove(self, path: str): ...
