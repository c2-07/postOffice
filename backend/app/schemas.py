from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class FileResponseItem(BaseModel):
    id: UUID
    filename: str | None
    filesize: int | None
    content_type: str | None
    created_on: datetime
    expiry_date: datetime | None
    is_expired: bool
    is_deleted: bool
    uploaded_by: str | None = None
    has_password: bool


class FilePublicPreview(BaseModel):
    id: UUID
    filename: str | None
    filesize: int | None
    content_type: str | None
    created_on: datetime
    expiry_date: datetime | None
    is_expired: bool
    uploaded_by: str | None
    download_url: str
