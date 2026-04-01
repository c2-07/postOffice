import logging
import os
from datetime import datetime, timezone

import aiofiles
from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile
from sqlmodel import Session

from app.database import get_session
from app.model import File

router = APIRouter()

UPLOAD_DIR = "uploads"
CHUNK_SIZE = 1024 * 1024  # 1 MB
MAX_FILE_SIZE = 1024 * 1024 * 1024 * 2  # 2 GB


def ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def shard_path(file_id: str) -> str:
    # Prevent flat directory explosion
    return os.path.join(UPLOAD_DIR, file_id[:2], file_id[2:4])


def build_paths(file_id: str) -> tuple[str, str]:
    base_dir = shard_path(file_id)
    ensure_dir(base_dir)

    final_path = os.path.join(base_dir, file_id)
    temp_path = final_path + ".tmp"

    return temp_path, final_path


def validate(file: UploadFile, expiry_date: datetime) -> None:
    if not file:
        raise HTTPException(400, "File not provided")

    if expiry_date.tzinfo is None:
        raise HTTPException(400, "TimeZone info not provided")

    if expiry_date <= datetime.now(timezone.utc):
        raise HTTPException(400, "Expiry must be in future")


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

            if total_size > MAX_FILE_SIZE:
                raise HTTPException(
                    413, f"File Too Large: size limit `{MAX_FILE_SIZE} Bytes`"
                )

            await f.write(chunk)

    return total_size


@router.post("/upload/")
async def upload_file(
    file: UploadFile,
    expiry_date: datetime = Form(...),
    session: Session = Depends(get_session),
):
    validate(file, expiry_date)

    record = File(
        filename=file.filename,
        filesize=file.size,
        content_type=file.content_type,
        created_on=datetime.now(timezone.utc),
        expiry_date=expiry_date,
    )

    temp_path, final_path = build_paths(str(record.id))

    try:
        size = await stream_to_disk(file, temp_path)

        os.replace(temp_path, final_path)

        record.filesize = size
        session.add(record)
        session.commit()

        logging.info("Upload success: %s (%d bytes)", record.id, size)

        return {"file_id": record.id}

    except HTTPException:
        safe_delete(temp_path)
        raise

    except Exception:
        safe_delete(temp_path)
        safe_delete(final_path)

        logging.exception("Upload failed")
        raise HTTPException(500, "Upload failed")
