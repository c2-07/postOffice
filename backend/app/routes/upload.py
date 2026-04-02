import logging
import os
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile
from sqlmodel import Session

from app.database import get_session
from app.helpers import build_paths, safe_delete, stream_to_disk, validate_file
from app.model import File

router = APIRouter(tags=["Upload File"])


@router.post("/uploadfile")
async def upload_file(
    file: UploadFile,
    expiry_date: datetime = Form(...),
    session: Session = Depends(get_session),
):
    validate_file(file, expiry_date)

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

        return {
            "message": f"file `{record.filename}` Uploaded Successfully",
            "file_id": record.id,
        }

    except HTTPException:
        safe_delete(temp_path)
        raise

    except Exception:
        safe_delete(temp_path)
        safe_delete(final_path)

        logging.exception("Upload failed")
        raise HTTPException(500, "Upload failed")


@router.post("/uploadfiles")
async def upload_batch(
    files: List[UploadFile],
    expiry_date: datetime = Form(...),
    session: Session = Depends(get_session),
):
    results = []

    for file in files:
        validate_file(file, expiry_date)

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

            results.append({"file_id": record.id})

        except Exception:
            safe_delete(temp_path)
            safe_delete(final_path)
            raise

    session.commit()
    return results
