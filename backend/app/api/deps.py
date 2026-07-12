from typing import Annotated

from fastapi import Depends
from sqlmodel import Session

from app.database import get_db_session

SessionDeps = Annotated[Session, Depends(get_db_session)]
