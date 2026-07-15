from datetime import datetime, timezone
from typing import Annotated
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel

from app.core.config import settings


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


FileID = Annotated[
    UUID | None,
    Field(description="Unique identifier for the file"),
]

Filename = Annotated[
    str | None,
    Field(description="Original name of the uploaded file"),
]

Filesize = Annotated[
    int | None,
    Field(description="Size of the file in bytes"),
]

ContentType = Annotated[
    str | None,
    Field(description="MIME type of the file"),
]

CreatedOn = Annotated[
    datetime,
    Field(description="Timestamp when the file was uploaded"),
]

ExpiryDate = Annotated[
    datetime | None,
    Field(description="Optional timestamp after which the file is considered expired"),
]

UploadedBy = Annotated[
    str | None,
    Field(description="Optional uploader name for preview display"),
]

PasswordHash = Annotated[
    str | None,
    Field(description="Optional password hash required for download"),
]


class File(SQLModel, table=True):
    """Represents a file uploaded to the system with metadata."""

    __tablename__ = "files"

    id: FileID = Field(primary_key=True, default_factory=uuid4)

    filename: Filename = None
    filesize: Filesize = None

    content_type: ContentType = None

    created_on: CreatedOn = Field(default_factory=utc_now)
    expiry_date: ExpiryDate = None

    uploaded_by: UploadedBy = None
    password_hash: PasswordHash = None

    is_expired: bool = Field(default=False)
    expired_on: datetime | None = Field(default=None)

    is_deleted: bool = Field(default=False)
    deleted_on: datetime | None = Field(default=None)

    @property
    def extension(self) -> str:
        """Returns the file extension extracted from the filename."""
        if self.filename and "." in self.filename:
            return self.filename.rsplit(".", 1)[-1]
        return ""

    @property
    def storage_key(self) -> str:
        return f"{self.id}.{self.extension}" if self.extension else f"{self.id}"

    @property
    def has_password(self) -> bool:
        return self.password_hash is not None

    @property
    def expired(self) -> bool:
        if self.is_expired:
            return True

        if self.expiry_date is not None and datetime.now(
            timezone.utc
        ) > self.expiry_date.astimezone(timezone.utc):
            return True

        return False
