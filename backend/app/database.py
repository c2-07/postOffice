from collections.abc import Iterator

from sqlalchemy import inspect, text
from sqlmodel import Session, SQLModel, create_engine

from app.core.config import settings
from app.models import File, User  # noqa: F401

engine = create_engine(settings.DATABASE_URL, echo=settings.DEBUG)


def _migrate_sqlite_file_ownership() -> None:
    """Add the nullable ownership column to databases created before auth."""
    if engine.dialect.name != "sqlite":
        return

    with engine.begin() as connection:
        inspector = inspect(connection)
        if not inspector.has_table("files"):
            return

        columns = {column["name"] for column in inspector.get_columns("files")}
        if "owner_id" not in columns:
            connection.execute(
                text("ALTER TABLE files ADD COLUMN owner_id CHAR(32) NULL")
            )


def init_db() -> None:
    _migrate_sqlite_file_ownership()
    SQLModel.metadata.create_all(engine)


def get_db_session() -> Iterator[Session]:
    with Session(engine) as session:
        yield session
