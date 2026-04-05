from sqlmodel import Session, SQLModel, create_engine

from app.model import File  # noqa

sqlite_file_name = "database.db"
sqlite_uri = f"sqlite:///{sqlite_file_name}"

engine = create_engine(sqlite_uri, echo=True)


def init_db():
    """Initialize the database by creating all registered tables."""
    SQLModel.metadata.create_all(engine)


def get_session():
    """
    Dependency to provide a database session for requests.
    Yields:
        Session: An active SQLAlchemy/SQLModel session.
    """
    with Session(engine) as session:
        yield session
