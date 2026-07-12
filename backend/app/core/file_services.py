from typing import AsyncGenerator
from uuid import UUID

import magic
from fastapi import UploadFile
from sqlmodel import Session, select

from app.core.config import settings
from app.core.storage.localstorage import LocalStorage
from app.models import File


class FileServices:
    localstorage = LocalStorage()

    def __init__(self, session: Session):
        self.session = session

    async def uploadfile(self, upload_file: UploadFile) -> None:
        file_metadata = await self.create_file_metadata(upload_file)
        # Generator for bytes Stream
        stream = self.get_bytes_stream(upload_file)
        await self.localstorage.upload(file_metadata.storage_key, stream)
        self.session.add(file_metadata)
        self.session.commit()

    async def deletefile(self, id: UUID) -> None:
        # storage key (PATH) for the file
        q = select(File).where(File.id == id)
        key = self.session.exec(q).first()

        if not key:
            raise ValueError("file not found")

        self.localstorage.delete(key.storage_key)
        self.session.delete(key)
        self.session.commit()

    def downloadfile(self, id: UUID) -> File | None:
        q = select(File).where(File.id == id)
        key = self.session.exec(q).first()

        if not key:
            return

        return key

    async def create_file_metadata(self, upload_file: UploadFile) -> File:
        header = await upload_file.read(2048)
        await upload_file.seek(0)

        return File(
            filename=upload_file.filename,
            filesize=upload_file.size,
            content_type=magic.from_buffer(header, mime=True),
        )

    async def get_bytes_stream(
        self, upload_file: UploadFile
    ) -> AsyncGenerator[bytes, None]:
        while chunk := await upload_file.read(settings.CHUNK_SIZE):
            yield chunk
