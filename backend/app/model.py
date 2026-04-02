from datetime import datetime, timezone
from uuid import UUID, uuid4

from pydantic import EmailStr
from sqlmodel import Field, SQLModel


class File(SQLModel, table=True):
    __tablename__ = "files"
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    filename: str | None
    filesize: int | None
    content_type: str | None
    created_on: datetime
    expiry_date: datetime | None

    @property
    def expired(self) -> bool:
        if (
            self.expiry_date is not None
            and datetime.now(timezone.utc) > self.expiry_date
        ):
            return True
        return False


class User(SQLModel, table=True):
    __tablename__ = "users"
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    username: str = Field(unique=True)
    email: EmailStr = Field(unique=True)
    # owned_items:
