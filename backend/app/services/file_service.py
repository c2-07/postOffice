# import logging
import hashlib
import hmac
import secrets
from datetime import datetime, timezone
from typing import Tuple
from uuid import UUID

from fastapi import HTTPException, UploadFile
from sqlmodel import Session, select

from app.core.config import settings
from app.core.execptions import FileToLargeError
from app.model import File
from app.storage.localstorage import LocalStorageProvider

# logger = logging.getLogger(__name__)


class FileService:
    """Service layer for handling file-related business logic."""

    CHUNK_SIZE = 1024 * 1024  # 1 MB
    PBKDF2_ITERATIONS = 200_000

    def __init__(self, session: Session):
        """Initializes service with a database session and storage provider."""
        self._session = session
        self._storage = LocalStorageProvider()

    async def upload(
        self,
        file: UploadFile,
        expiry: datetime,
        uploaded_by: str | None = None,
        password: str | None = None,
    ) -> UUID:
        """
        Handles the file upload process: validation, storage, and database recording.

        Args:
            file: The uploaded file object from FastAPI.
            expiry: When the file should be considered expired.

        Returns:
            UUID: The unique ID of the saved file record.
        """
        self.validate_file(file, expiry)
        password_hash = self._hash_password(password) if password else None
        record = File(
            filename=file.filename,
            filesize=file.size,
            content_type=file.content_type,
            created_on=datetime.now(timezone.utc),
            expiry_date=expiry,
            uploaded_by=uploaded_by,
            password_hash=password_hash,
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

        if record.is_deleted:
            raise HTTPException(404, "File has been deleted")

        if record.expired:
            raise HTTPException(410, "Link Expired")

        file_path = self.get_file_path(record.id)

        filename = record.filename
        if not isinstance(filename, str):
            filename = record.id.hex

        return filename, file_path

    def get_file_preview(self, file_id: UUID) -> File:
        # TODO: ADD PASSOWRD PROTECTION FOR SHOW FILEMETA DATA WITH PASSOWRD
        record = self._session.get(File, file_id)
        if record is None or record.is_deleted:
            raise HTTPException(404, "File Not Found")
        return record

    def verify_download_password(self, record: File, password: str | None) -> None:
        if not record.has_password:
            return
        if not password:
            raise HTTPException(401, "Password required for this file")
        if not self._verify_password(password, record.password_hash or ""):
            raise HTTPException(401, "Invalid file password")

    def list_files(self) -> list[File]:
        statement = select(File)
        return list(self._session.exec(statement).all())

    def mark_expired_files(self) -> int:
        now_utc = datetime.now(timezone.utc)
        statement = select(File).where(File.is_deleted == False)  # noqa: E712
        files = self._session.exec(statement).all()
        expired_count = 0
        for file in files:
            if file.expired and not file.is_expired:
                file.is_expired = True
                file.expired_on = now_utc
                self._storage.delete_file(file.id)
                expired_count += 1
        if expired_count:
            self._session.commit()
        return expired_count

    def delete_file(self, file_id: UUID) -> File:
        record = self._session.get(File, file_id)
        if record is None or record.is_deleted:
            raise HTTPException(404, "File Not Found")

        record.is_deleted = True
        record.deleted_on = datetime.now(timezone.utc)
        self._storage.delete_file(record.id)
        self._session.commit()
        self._session.refresh(record)
        return record

    def update_file(
        self,
        file_id: UUID,
        expiry_date: datetime | None = None,
        password: str | None = None,
        uploaded_by: str | None = None,
    ) -> File:
        record = self._session.get(File, file_id)
        if record is None or record.is_deleted:
            raise HTTPException(404, "File Not Found")

        if expiry_date is not None:
            if expiry_date.tzinfo is None:
                raise HTTPException(400, "TimeZone info not provided")
            if expiry_date <= datetime.now(timezone.utc):
                raise HTTPException(400, "Expiry must be in future")
            record.expiry_date = expiry_date
            record.is_expired = False
            record.expired_on = None

        if password is not None:
            record.password_hash = self._hash_password(password) if password else None

        if uploaded_by is not None:
            record.uploaded_by = uploaded_by

        self._session.commit()
        self._session.refresh(record)
        return record

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

    def _hash_password(self, password: str) -> str:
        salt = secrets.token_hex(16)
        digest = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            bytes.fromhex(salt),
            self.PBKDF2_ITERATIONS,
        ).hex()
        return f"pbkdf2_sha256${self.PBKDF2_ITERATIONS}${salt}${digest}"

    def _verify_password(self, password: str, stored_hash: str) -> bool:
        parts = stored_hash.split("$")
        if len(parts) != 4 or parts[0] != "pbkdf2_sha256":
            return False

        _, iteration_text, salt, expected = parts
        try:
            iterations = int(iteration_text)
            calculated = hashlib.pbkdf2_hmac(
                "sha256",
                password.encode("utf-8"),
                bytes.fromhex(salt),
                iterations,
            ).hex()
            return hmac.compare_digest(calculated, expected)
        except Exception:
            return False
