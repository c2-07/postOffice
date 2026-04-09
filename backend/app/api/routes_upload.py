from datetime import datetime

from fastapi import APIRouter, Depends, Form, UploadFile
from sqlmodel import Session

from app.core.config import settings
from app.database import get_session
from app.services.file_service import FileService

router = APIRouter(tags=["Upload File"])


@router.post("/files/upload")
async def upload_file(
    file: UploadFile,
    expiry: datetime = Form(...),
    password: str | None = Form(default=None),
    uploaded_by: str | None = Form(default=None),
    session: Session = Depends(get_session),
):
    """
    Uploads a file with a specified expiry date.

    Args:
        file: The file to be uploaded.
        expiry: ISO format datetime for file expiration.
        session: Database session injected via dependency.

    Returns:
        JSON response with success message, generated file ID, and share link.
    """
    file_service = FileService(session)
    file_id = await file_service.upload(
        file=file,
        expiry=expiry,
        uploaded_by=uploaded_by,
        password=password,
    )

    file_link = f"{settings.FRONTEND_BASE_URL}/open-link.html?file={file_id}"
    return {
        "message": "File successfully uploaded to the server",
        "file_id": str(file_id),
        "file_page_url": file_link,
    }
