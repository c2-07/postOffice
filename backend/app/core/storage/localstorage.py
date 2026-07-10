import os
from typing import AsyncIterable

import aiofiles

from app.core.storage.base import BaseStorage


class LocalStorage(BaseStorage):
    async def upload(self, path: str, stream: AsyncIterable):
        size = 0
        async with aiofiles.open(path, "wb") as f:
            async for chunk in stream:
                if not chunk:
                    break

                await f.write(chunk)
                size += len(chunk)

    def download(self, path: str): ...

    def delete(self, path: str):
        try:
            os.remove(path)
        except FileNotFoundError:
            pass
