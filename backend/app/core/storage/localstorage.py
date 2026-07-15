import os
from typing import AsyncIterable, AsyncGenerator

import aiofiles

from app.core.storage.base import BaseStorage
from app.core.config import settings


class LocalStorage(BaseStorage):
    def _get_full_path(self, path: str) -> str:
        return os.path.join(settings.UPLOAD_DIR, path)

    async def save(self, path: str, stream: AsyncIterable[bytes]):
        full_path = self._get_full_path(path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        async with aiofiles.open(full_path, "wb") as f:
            async for chunk in stream:
                if not chunk:
                    break

                await f.write(chunk)

    def get_file(self, path: str):
        pass

    async def get_stream(self, path: str) -> AsyncGenerator[bytes, None]:
        full_path = self._get_full_path(path)
        async with aiofiles.open(full_path, "rb") as f:
            while chunk := await f.read(settings.CHUNK_SIZE):
                yield chunk

    def remove(self, path: str):
        full_path = self._get_full_path(path)
        try:
            os.remove(full_path)
        except FileNotFoundError:
            pass
