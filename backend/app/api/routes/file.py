from uuid import UUID

from fastapi import APIRouter, UploadFile, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlmodel import select

from app.api.deps import SessionDeps, FileServiceDeps
from app.models import File
from app.errors import FileRecordNotFoundError

router = APIRouter(prefix="/files", tags=["files"])


@router.get("/")
async def list_files(session: SessionDeps):
    stmt = select(File)
    return session.exec(stmt).all()


@router.get("/{id}", response_class=StreamingResponse)
async def get_file(service: FileServiceDeps, id: UUID):
    try:
        file = await service.get_file(id)
    except FileRecordNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="file not found"
        )

    stream = await service.get_file_stream(file.storage_key)
    return StreamingResponse(stream, media_type=file.content_type)


@router.post("/", status_code=status.HTTP_201_CREATED)
async def upload_file(service: FileServiceDeps, file_upload: UploadFile):
    try:
        uploaded_file = await service.upload_file(file_upload)
        return uploaded_file
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"failed to upload file: {e}",
        )


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(service: FileServiceDeps, id: UUID):

    try:
        await service.delete_file(id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )
