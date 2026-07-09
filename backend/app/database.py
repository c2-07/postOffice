from typing import Generator
from app.core.config import settings
from app.models import File # noqa: F401
from sqlmodel import create_engine, SQLModel, Session

engine = create_engine(settings.DATABASE_URL, echo=settings.DEBUG)

def init_db():
    SQLModel.metadata.create_all(engine)

def get_db_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
