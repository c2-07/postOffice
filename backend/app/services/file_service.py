import logging
from datetime import datetime, timezone
from typing import Tuple
from uuid import UUID

from fastapi import HTTPException, UploadFile
from sqlmodel import Session

from app.model import File
from app.storage.localstorage import LocalStorageProvider

logger = logging.getLogger(__name__)


class FileService:
    def __init__(self, session: Session):
        self._session = session
        self._storage = LocalStorageProvider()

    async def upload(self, file: UploadFile, expiry: datetime) -> UUID:

        self.validate_file(file, expiry)
        record = File(
            filename=file.filename,
            filesize=file.size,
            content_type=file.content_type,
            created_on=datetime.now(timezone.utc),
            expiry_date=expiry,
        )

        # Note: You can't await an async generator because an
        # Async Generator is a factory for Promises, not a Promise itself.
        stream = self._get_file_chunks(file)
        size = await self._storage.save_file(record.id, stream)
        record.filesize = size

        self._session.add(record)
        self._session.commit()

        return record.id

    async def _get_file_chunks(self, file: UploadFile):
        while chunk := await file.read():
            yield chunk

    def validate_file(self, file: UploadFile, expiry: datetime) -> None:
        if not file:
            raise HTTPException(400, "File not provided")

        if expiry.tzinfo is None:
            raise HTTPException(400, "TimeZone info not provided")

        if expiry <= datetime.now(timezone.utc):
            raise HTTPException(400, "Expiry must be in future")

    def get_file_path(cls, file_id: UUID) -> str:
        return cls._storage._get_file_path(file_id)

    def download(self, file_id: UUID) -> Tuple[str, str]:
        record = self._session.get(File, file_id)

        if record is None:
            raise HTTPException(404, "File Not Found")

        if record.expired:
            raise HTTPException(410, "Link Expired")

        file_service = FileService(self._session)
        file_path = file_service.get_file_path(record.id)

        filename = record.filename
        if not isinstance(filename, str):
            filename = record.id.hex

        return filename, file_path
