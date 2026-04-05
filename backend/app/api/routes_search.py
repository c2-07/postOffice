import logging
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from app.database import get_session
from app.model import File, User

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Search"])


@router.get("/search/file")
async def search_file(
    id: Annotated[UUID, Query()], session: Session = Depends(get_session)
):
    """
    Search for file metadata by its ID.

    Args:
        id: The UUID of the file to search for.
        session: Database session.
    """
    record = session.get(File, id)

    if record is None:
        logging.info("No Match Found.")
        raise HTTPException(404, "Match Not Found")

    logger.info(record)
    return {"message": "Match Found", "result": record}


@router.get("/search/user")
async def search_user(
    id: Annotated[UUID, Query()], session: Session = Depends(get_session)
):
    """
    Search for user information by their ID.

    Args:
        id: The UUID of the user to search for.
        session: Database session.
    """
    record = session.get(User, id)

    if record is None:
        logging.info("No Match Found.")
        raise HTTPException(404, "Match Not Found")

    logger.info(record)
    return {"message": "Match Found", "result": record}
