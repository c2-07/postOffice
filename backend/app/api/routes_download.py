from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response
from fastapi.responses import FileResponse
from sqlmodel import Session

from app.database import get_session
from app.services.file_service import FileService

router = APIRouter(tags=["Download File"])


@router.get("/downloadfile", response_class=Response)
async def download_file(
    id: Annotated[UUID, Query()], session: Session = Depends(get_session)
):
    file_service = FileService(session)
    filename, path = file_service.download(file_id=id)
    return FileResponse(
        path=path,
        filename=filename,
    )
