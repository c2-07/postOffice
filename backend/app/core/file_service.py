from app.errors import FileRecordNotFoundError
from app.core.storage.base import BaseStorage
from typing import AsyncGenerator
from uuid import UUID

import magic
from fastapi import UploadFile
from sqlmodel import Session, select

from app.core.config import settings
from app.auth.schemas import CurrentUser
from app.models import File


class FileService:
    def __init__(self, session: Session, storage_provider: BaseStorage):
        self.session = session
        self.storage = storage_provider

    async def upload_file(self, file_upload: UploadFile, owner_id: UUID) -> File:
        file = await self.build_metadata(file_upload, owner_id)

        self.session.add(file)

        stream = self.get_byte_stream(file_upload)
        try:
            await self.storage.save(file.storage_key, stream)
            self.session.commit()
            self.session.refresh(file)
        except Exception:
            self.session.rollback()
            raise

        return file

    async def delete_file(self, id: UUID, user: CurrentUser) -> None:
        file_record = await self.get_authorized_file(id, user)

        self.storage.remove(file_record.storage_key)
        self.session.delete(file_record)
        self.session.commit()

    async def get_authorized_file(self, id: UUID, user: CurrentUser) -> File:
        stmt = select(File).where(File.id == id)
        file = self.session.exec(stmt).first()

        if file is None:
            raise FileRecordNotFoundError()

        if not user.is_superuser and file.owner_id != user.id:
            raise FileRecordNotFoundError()

        return file

    async def get_file_stream(self, storage_key: str) -> AsyncGenerator[bytes, None]:
        return self.storage.get_stream(storage_key)

    async def build_metadata(self, file_upload: UploadFile, owner_id: UUID) -> File:
        header = await file_upload.read(2048)
        await file_upload.seek(0)

        return File(
            owner_id=owner_id,
            filename=file_upload.filename,
            filesize=file_upload.size,
            content_type=magic.from_buffer(header, mime=True),
        )

    async def get_byte_stream(
        self, file_upload: UploadFile
    ) -> AsyncGenerator[bytes, None]:

        while chunk := await file_upload.read(settings.CHUNK_SIZE):
            yield chunk
