from uuid import UUID

from fastapi import APIRouter, UploadFile
from fastapi.responses import FileResponse
from sqlmodel import select

from app.api.deps import SessionDeps
from app.core.file_services import FileServices
from app.models import File

router = APIRouter(prefix="/files", tags=["files"])


@router.get("/")
async def getfiles(session: SessionDeps):
    q = select(File)
    return session.exec(q).all()


@router.post("/")
async def uploadfile(session: SessionDeps, upload_file: UploadFile):
    file_services = FileServices(session)
    await file_services.uploadfile(upload_file)
    return {"message": "file uploaded"}


@router.get("/{id}")
async def getfile(session: SessionDeps, id: UUID):
    file_services = FileServices(session)
    file = file_services.downloadfile(id)
    if not file:
        return {"message": "file not found"}
    return FileResponse(
        file.storage_key, media_type=file.content_type, filename=file.filename
    )


@router.delete("/{id}")
async def deletefile(session: SessionDeps, id: UUID):
    file_services = FileServices(session)
    try:
        await file_services.deletefile(id)
        return {"message": "file deleted"}
    except ValueError:
        return {"message": "file not found"}
