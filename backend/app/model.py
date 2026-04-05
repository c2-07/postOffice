from datetime import datetime, timezone

# from typing import List
from uuid import UUID, uuid4

from pydantic import EmailStr
from sqlmodel import Field, SQLModel


class File(SQLModel, table=True):
    """Represents a file uploaded to the system with its metadata and ownership."""

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
    owner_id: UUID = Field(
        default=None,
        foreign_key="users.id",
        description="ID of the user who owns this file",
    )

    @property
    def expired(self) -> bool:
        """Checks if the file has passed its expiry date."""
        if self.expiry_date is not None and datetime.now(
            timezone.utc
        ) > self.expiry_date.astimezone(timezone.utc):
            return True
        return False


class User(SQLModel, table=True):
    """Represents a registered user in the system."""

    __tablename__ = "users"
    id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
        description="Unique identifier for the user",
    )
    username: str = Field(unique=True, description="Unique display name for the user")
    email: EmailStr = Field(unique=True, description="Validated unique email address")
    hashed_password: str
