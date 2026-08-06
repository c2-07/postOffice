from uuid import UUID

from fastapi import APIRouter, UploadFile, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlmodel import select

from app.api.deps import SessionDeps, FileServiceDeps
from app.auth.deps import CurrentUserDeps
from app.models import File
from app.schemas import FilePublicPreview
from app.errors import FileRecordNotFoundError

router = APIRouter(prefix="/files", tags=["files"])


@router.get("/")
async def list_files(session: SessionDeps, user: CurrentUserDeps):
    stmt = select(File)
    if not user.is_superuser:
        stmt = stmt.where(File.owner_id == user.id)
    return session.exec(stmt).all()


@router.get("/{id}", response_class=StreamingResponse)
async def get_file(service: FileServiceDeps, id: UUID, user: CurrentUserDeps):
    try:
        file = await service.get_authorized_file(id, user)
    except FileRecordNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="file not found"
        )

    stream = await service.get_file_stream(file.storage_key)
    return StreamingResponse(stream, media_type=file.content_type)


@router.post("/", status_code=status.HTTP_201_CREATED)
async def upload_file(
    service: FileServiceDeps, file: UploadFile, user: CurrentUserDeps
):
    try:
        response = await service.upload_file(file, user.id)
        return response
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="failed to upload file",
        )


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(service: FileServiceDeps, id: UUID, user: CurrentUserDeps):
    try:
        await service.delete_file(id, user)
    except FileRecordNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="file not found",
        )

@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
async def delete_all_files(service: FileServiceDeps, user: CurrentUserDeps):
    try:
        await service.delete_all_files(user)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="failed to delete all files",
        )

@router.get("/public/{id}", response_model=FilePublicPreview)
async def get_public_file_preview(service: FileServiceDeps, id: UUID):
    try:
        file = await service.get_public_file(id)
    except FileRecordNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="file not found")
        
    return FilePublicPreview(
        id=file.id,
        filename=file.filename,
        filesize=file.filesize,
        content_type=file.content_type,
        created_on=file.created_on,
        expiry_date=file.expiry_date,
        is_expired=file.expired,
        uploaded_by=file.uploaded_by,
        download_url=f"/api/files/public/{file.id}/download"
    )

@router.get("/public/{id}/download", response_class=StreamingResponse)
async def download_public_file(service: FileServiceDeps, id: UUID):
    try:
        file = await service.get_public_file(id)
    except FileRecordNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="file not found")
        
    stream = await service.get_file_stream(file.storage_key)
    return StreamingResponse(
        stream, 
        media_type=file.content_type,
        headers={"Content-Disposition": f'attachment; filename="{file.filename}"'}
    )
