from sqlalchemy import text
from sqlmodel import Session, SQLModel, create_engine

from app.model import File  # noqa

sqlite_file_name = "database.db"
sqlite_uri = f"sqlite:///{sqlite_file_name}"

engine = create_engine(sqlite_uri, echo=True)


def init_db():
    """Initialize the database by creating all registered tables."""
    SQLModel.metadata.create_all(engine)
    apply_sqlite_migrations()


def apply_sqlite_migrations() -> None:
    """Applies lightweight SQLite migrations for existing local databases."""
    with engine.begin() as conn:
        tables = {
            row[0]
            for row in conn.exec_driver_sql("SELECT name FROM sqlite_master").fetchall()
        }
        if "users" in tables:
            conn.execute(text("DROP TABLE users"))

        file_columns = {
            row[1]
            for row in conn.exec_driver_sql("PRAGMA table_info(files)").fetchall()
        }

        if "uploaded_by" not in file_columns:
            conn.execute(text("ALTER TABLE files ADD COLUMN uploaded_by TEXT"))

        if "password_hash" not in file_columns:
            conn.execute(text("ALTER TABLE files ADD COLUMN password_hash TEXT"))
        if "is_expired" not in file_columns:
            conn.execute(
                text("ALTER TABLE files ADD COLUMN is_expired BOOLEAN DEFAULT 0")
            )
        if "expired_on" not in file_columns:
            conn.execute(text("ALTER TABLE files ADD COLUMN expired_on DATETIME"))
        if "is_deleted" not in file_columns:
            conn.execute(
                text("ALTER TABLE files ADD COLUMN is_deleted BOOLEAN DEFAULT 0")
            )
        if "deleted_on" not in file_columns:
            conn.execute(text("ALTER TABLE files ADD COLUMN deleted_on DATETIME"))


def get_session():
    """
    Dependency to provide a database session for requests.
    Yields:
        Session: An active SQLAlchemy/SQLModel session.
    """
    with Session(engine) as session:
        yield session
