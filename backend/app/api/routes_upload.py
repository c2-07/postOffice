from datetime import datetime

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile
from sqlmodel import Session

from app.core.config import settings
from app.core.execptions import FileToLargeError
from app.database import get_session
from app.services.file_service import FileService

router = APIRouter(tags=["Upload File"])


@router.post("/uploadfile")
async def upload_file(
    file: UploadFile,
    expiry: datetime = Form(...),
    session: Session = Depends(get_session),
):
    """
    Uploads a file with a specified expiry date.

    Args:
        file: The file to be uploaded.
        expiry: ISO format datetime for file expiration.
        session: Database session injected via dependency.

    Returns:
        JSON response with success message and the generated file ID.
    """
    file_service = FileService(session)
    file_id = await file_service.upload(file, expiry)

    return {"message": "File Successfully Uploaded To The Server", "file_id": file_id}
