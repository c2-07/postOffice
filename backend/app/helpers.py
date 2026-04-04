import os
from datetime import datetime, timezone

import aiofiles
from fastapi import HTTPException, UploadFile

from app.core.config import settings

CHUNK_SIZE = 1024 * 1024  # 1 MB


def shard_path(file_id: str) -> str:
    # Prevent flat directory explosion
    return os.path.join(settings.UPLOAD_DIR, file_id[:2], file_id[2:4])


def ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def build_paths(file_id: str) -> tuple[str, str]:
    base_dir = shard_path(file_id)
    ensure_dir(base_dir)

    final_path = os.path.join(base_dir, file_id)
    temp_path = final_path + ".tmp"

    return temp_path, final_path


def safe_delete(path: str) -> None:
    try:
        os.remove(path)
    except FileNotFoundError:
        pass


async def stream_to_disk(upload: UploadFile, temp_path: str) -> int:
    total_size = 0
    async with aiofiles.open(temp_path, "wb") as f:
        while True:
            chunk = await upload.read(CHUNK_SIZE)
            if not chunk:
                break
            total_size += len(chunk)

            if total_size > settings.MAX_UPLOAD_SIZE:
                raise HTTPException(
                    413,
                    f"File Too Large: size limit `{settings.MAX_UPLOAD_SIZE} Bytes`",
                )

            await f.write(chunk)

    return total_size
