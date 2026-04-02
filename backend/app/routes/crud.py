from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.database import get_session
from app.model import File

router = APIRouter()


@router.get("/list")
async def list_db(session: Session = Depends(get_session)):
    statement = select(File)
    result = session.exec(statement).all()
    return {"results": result}
