from datetime import datetime
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class File(SQLModel, table=True):
    __tablename__ = "files"
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    filename: str | None
    filesize: int | None
    content_type: str | None
    created_on: datetime
    expiry_date: datetime | None
