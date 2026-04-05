# import logging
from datetime import datetime, timezone
from typing import Tuple
from uuid import UUID

from fastapi import HTTPException, UploadFile
from sqlmodel import Session

from app.core.config import settings
from app.core.execptions import FileToLargeError
from app.model import File
from app.storage.localstorage import LocalStorageProvider

# logger = logging.getLogger(__name__)


class FileService:
    """Service layer for handling file-related business logic."""

    CHUNK_SIZE = 1024 * 1024  # 1 MB

    def __init__(self, session: Session):
        """Initializes service with a database session and storage provider."""
        self._session = session
        self._storage = LocalStorageProvider()

    async def upload(self, file: UploadFile, expiry: datetime) -> UUID:
        """
        Handles the file upload process: validation, storage, and database recording.

        Args:
            file: The uploaded file object from FastAPI.
            expiry: When the file should be considered expired.

        Returns:
            UUID: The unique ID of the saved file record.
        """
        self.validate_file(file, expiry)
        record = File(
            filename=file.filename,
            filesize=file.size,
            content_type=file.content_type,
            created_on=datetime.now(timezone.utc),
            expiry_date=expiry,
        )

        # Get an async generator for file chunks to stream to storage
        stream = self._get_file_chunks(file)
        try:
            size = await self._storage.save_file(record.id, stream)

        except FileToLargeError:
            raise HTTPException(
                413,
                f"File Too Large: size limit `{settings.MAX_UPLOAD_SIZE} Bytes`",
            )

        record.filesize = size

        self._session.add(record)
        self._session.commit()

        return record.id

    def download(self, file_id: UUID) -> Tuple[str, str]:
        """
        Prepares a file for download by retrieving metadata and path.

        Args:
            file_id: The UUID of the file to download.

        Returns:
            Tuple[str, str]: (filename, absolute_file_path)

        Raises:
            HTTPException: 404 if not found, 410 if expired.
        """
        record = self._session.get(File, file_id)

        if record is None:
            raise HTTPException(404, "File Not Found")

        if record.expired:
            raise HTTPException(410, "Link Expired")

        file_path = self.get_file_path(record.id)

        filename = record.filename
        if not isinstance(filename, str):
            filename = record.id.hex

        return filename, file_path

    async def _get_file_chunks(self, file: UploadFile):
        """Async generator that yields chunks from the UploadFile."""
        while chunk := await file.read(self.CHUNK_SIZE):
            yield chunk

    def validate_file(self, file: UploadFile, expiry: datetime) -> None:
        """Validates file presence, timezone info, and future expiry date."""
        if not file:
            raise HTTPException(400, "File not provided")

        if expiry.tzinfo is None:
            raise HTTPException(400, "TimeZone info not provided")

        if expiry <= datetime.now(timezone.utc):
            raise HTTPException(400, "Expiry must be in future")

    def get_file_path(self, file_id: UUID) -> str:
        """Resolves the physical storage path for a given file ID."""
        return self._storage._get_file_path(file_id)
