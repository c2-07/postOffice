from app.core.storage.localstorage import LocalStorage
from app.core.storage.base import BaseStorage
from app.core.file_service import FileService
from typing import Annotated

from fastapi import Depends
from sqlmodel import Session

from app.database import get_db_session

SessionDeps = Annotated[Session, Depends(get_db_session)]
StorageDeps = Annotated[BaseStorage, Depends(LocalStorage)]

def get_file_service(session: SessionDeps, storage: StorageDeps) -> FileService:
    return FileService(session, storage)

FileServiceDeps = Annotated[FileService, Depends(get_file_service)]
