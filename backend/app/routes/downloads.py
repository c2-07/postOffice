from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import FileResponse
from sqlmodel import Session

from app.database import get_session
from app.helpers import shard_path
from app.model import File

router = APIRouter(tags=["Download File"])


@router.get("/downloadfile", response_class=Response)
async def download_file(
    id: Annotated[UUID, Query()], session: Session = Depends(get_session)
):
    result = session.get(File, id)

    if result is None:
        raise HTTPException(404, "File with the given ID not found.")

    file_path = shard_path(str(result.id)) + f"/{result.id}"

    return FileResponse(
        path=file_path,
        filename=result.filename,
    )
