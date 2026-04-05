import os
from typing import AsyncIterable
from uuid import UUID

import aiofiles

from app.core.config import settings
from app.core.execptions import FileToLargeError

from .base import StorageProvider


class LocalStorageProvider(StorageProvider):
    """Implementation of storage on the local filesystem with path sharding."""

    @classmethod
    async def save_file(cls, file_id: UUID, stream: AsyncIterable[bytes]):
        """Saves the file to disk and returns its size on successful write."""
        temp_path, final_path = cls.build_paths(file_id)
        file_size = await cls.stream_to_disk(stream, temp_path)
        # Atomic replace to ensure file is only 'ready' once fully written
        os.replace(temp_path, final_path)
        return file_size

    @classmethod
    async def stream_to_disk(cls, stream: AsyncIterable[bytes], temp_path: str) -> int:
        """Asynchronously writes chunks from stream to a temporary file path."""
        total_size = 0
        async with aiofiles.open(temp_path, "wb") as f:
            async for chunk in stream:
                if not chunk:
                    break
                total_size += len(chunk)

                # Enforcement of max file size during the streaming process
                if total_size > settings.MAX_UPLOAD_SIZE:
                    os.remove(temp_path)
                    raise FileToLargeError

                await f.write(chunk)

        return total_size

    @classmethod
    def delete_file(cls, file_id: UUID):
        """Deletes a file from disk. Ignores if file is already missing."""
        file_path = cls._get_file_path(file_id)

        try:
            os.remove(file_path)
        except FileNotFoundError:
            pass

    @classmethod
    def _get_file_path(cls, file_id: UUID) -> str:
        """Helper to get the full sharded filesystem path for a file ID."""
        _, file_path = cls.build_paths(file_id)
        return file_path

    @classmethod
    def ensure_dir(cls, path: str) -> None:
        """Creates directory tree if it doesn't exist."""
        os.makedirs(path, exist_ok=True)

    @classmethod
    def shard_path(cls, file_id: UUID) -> str:
        """
        Creates a sharded path (e.g., dir/ab/cd/uuid) to prevent
        filesystem performance degradation in a single flat directory.
        """
        id = str(file_id)
        return os.path.join(settings.UPLOAD_DIR, id[:2], id[2:4])

    @classmethod
    def build_paths(cls, file_id: UUID) -> tuple[str, str]:
        """Returns (temporary_path, final_path) for a given file ID."""
        id = str(file_id)

        base_dir = cls.shard_path(file_id)
        cls.ensure_dir(base_dir)

        final_path = os.path.join(base_dir, id)
        temp_path = final_path + ".tmp"

        return temp_path, final_path
