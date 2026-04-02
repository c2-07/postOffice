import logging
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from app.database import get_session
from app.model import File, User

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Search"])


@router.get("/search/file")
async def search_file(
    id: Annotated[UUID, Query()], session: Session = Depends(get_session)
):
    result = session.get(File, id)

    if result is None:
        logging.info("No Match Found.")
        raise HTTPException(404, "Match Not Found")

    logger.info(result)
    return {"message": "Match Found.", "result": result}


@router.get("/search/user")
async def search_user(
    id: Annotated[UUID, Query()], session: Session = Depends(get_session)
):
    result = session.get(User, id)

    if result is None:
        logging.info("No Match Found.")
        raise HTTPException(404, "Match Not Found")

    logger.info(result)
    return {"message": "Match Found.", "result": result}
