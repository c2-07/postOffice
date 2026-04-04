import os
from typing import AsyncIterable
from uuid import UUID

import aiofiles
from fastapi import HTTPException

from app.core.config import settings

from .base import StorageProvider


class LocalStorageProvider(StorageProvider):
    @classmethod
    async def save_file(cls, file_id: UUID, stream: AsyncIterable[bytes]):
        """Saves the file to disk and returns it's size on successful write"""
        temp_path, final_path = cls.build_paths(file_id)
        file_size = await cls.stream_to_disk(stream, temp_path)
        os.replace(temp_path, final_path)
        return file_size

    @classmethod
    async def stream_to_disk(cls, stream: AsyncIterable[bytes], temp_path: str) -> int:
        total_size = 0
        async with aiofiles.open(temp_path, "wb") as f:
            async for chunk in stream:
                if not chunk:
                    break
                total_size += len(chunk)

                if total_size > settings.MAX_UPLOAD_SIZE:
                    # Cleaning up
                    os.remove(temp_path)
                    raise HTTPException(
                        413,
                        f"File Too Large: size limit `{
                            settings.MAX_UPLOAD_SIZE
                        } Bytes`",
                    )

                await f.write(chunk)

        return total_size

    @classmethod
    def delete_file(cls, file_id: UUID):
        """
        Deletes a file based on its ID (UUID or String).
        Always resolves the sharded path first.
        """
        file_path = cls._get_file_path(file_id)

        try:
            os.remove(file_path)
        except FileNotFoundError:
            pass

    @classmethod
    def _get_file_path(cls, file_id: UUID) -> str:
        _, file_path = cls.build_paths(file_id)
        return file_path

    @classmethod
    def ensure_dir(cls, path: str) -> None:
        os.makedirs(path, exist_ok=True)

    @classmethod
    def shard_path(cls, file_id: UUID) -> str:
        """
        Prevent flat directory explosion
        """
        id = str(file_id)
        return os.path.join(settings.UPLOAD_DIR, id[:2], id[2:4])

    @classmethod
    def build_paths(cls, file_id: UUID) -> tuple[str, str]:
        """Builds path on the basis of provided UUID and return final_path and final_path + '.tmp'"""
        id = str(file_id)

        base_dir = cls.shard_path(file_id)
        cls.ensure_dir(base_dir)

        final_path = os.path.join(base_dir, id)
        temp_path = final_path + ".tmp"

        return temp_path, final_path
