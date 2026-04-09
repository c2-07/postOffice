from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from uuid import UUID

from app.database import get_session
from app.services.file_service import FileService
from app.model import File

router = APIRouter()


@router.get("/list")
async def list_db(session: Session = Depends(get_session)):
    """
    Returns a list of all files in the database.

    Args:
        session: Database session.
    """
    statement = select(File)
    result = session.exec(statement).all()
    return {
        "results": [
            {
                "id": record.id,
                "filename": record.filename,
                "filesize": record.filesize,
                "content_type": record.content_type,
                "created_on": record.created_on,
                "expiry_date": record.expiry_date,
                "is_expired": record.expired,
                "is_deleted": record.is_deleted,
                "uploaded_by": record.uploaded_by,
                "has_password": record.has_password,
            }
            for record in result
        ]
    }

