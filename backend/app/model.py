from datetime import datetime, timezone

from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class File(SQLModel, table=True):
    """Represents a file uploaded to the system with metadata."""

    __tablename__ = "files"
    id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
        description="Unique identifier for the file",
    )
    filename: str | None = Field(description="Original name of the uploaded file")
    filesize: int | None = Field(description="Size of the file in bytes")
    content_type: str | None = Field(description="MIME type of the file")
    created_on: datetime = Field(description="Timestamp when the file was uploaded")
    expiry_date: datetime | None = Field(
        description="Optional timestamp after which the file is considered expired"
    )
    uploaded_by: str | None = Field(
        default=None,
        description="Optional uploader name for preview display",
    )
    password_hash: str | None = Field(
        default=None,
        description="Optional password hash required for download",
    )
    is_expired: bool = Field(default=False)
    expired_on: datetime | None = Field(default=None)
    is_deleted: bool = Field(default=False)
    deleted_on: datetime | None = Field(default=None)

    @property
    def has_password(self) -> bool:
        return bool(self.password_hash)

    @property
    def expired(self) -> bool:
        """Checks if the file has passed its expiry date."""
        if self.is_expired:
            return True
        if self.expiry_date is not None and datetime.now(
            timezone.utc
        ) > self.expiry_date.astimezone(timezone.utc):
            return True
        return False
