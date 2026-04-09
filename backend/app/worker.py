import asyncio

from sqlmodel import Session

from app.core.config import settings
from app.database import engine
from app.services.file_service import FileService


async def cleanup_expired_files_loop() -> None:
    """Background loop that marks/deletes expired files periodically."""
    while True:
        with Session(engine) as session:
            file_service = FileService(session)
            file_service.mark_expired_files()
        await asyncio.sleep(settings.CLEANUP_INTERVAL_SECONDS)
