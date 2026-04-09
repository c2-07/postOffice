from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response
from fastapi.responses import FileResponse
from sqlmodel import Session

from app.core.config import settings
from app.database import get_session
from app.schemas import FilePublicPreview
from app.services.file_service import FileService

router = APIRouter(tags=["Download File"])


@router.get("/files/{file_id}", response_model=FilePublicPreview)
async def get_file_public_page(
    file_id: UUID,
    password: str | None = Query(default=None),
    session: Session = Depends(get_session),
):
    """Returns public file metadata for preview page before download."""
    file_service = FileService(session)
    record = file_service.get_file_preview(file_id=file_id)
    file_service.verify_download_password(record, password)

    return FilePublicPreview(
        id=record.id,
        filename=record.filename,
        filesize=record.filesize,
        content_type=record.content_type,
        created_on=record.created_on,
        expiry_date=record.expiry_date,
        is_expired=record.expired,
        uploaded_by=record.uploaded_by,
        download_url=f"{settings.API_BASE_URL}/files/{record.id}/download",
    )


@router.get("/files/{file_id}/download", response_class=Response)
async def download_file_by_path(
    file_id: UUID,
    password: str | None = Query(default=None),
    session: Session = Depends(get_session),
):
    """Downloads file via friendly route after preview page."""
    file_service = FileService(session)
    record = file_service.get_file_preview(file_id=file_id)
    file_service.verify_download_password(record, password)
    filename, path = file_service.download(file_id=file_id)
    return FileResponse(path=path, filename=filename)
