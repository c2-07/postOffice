"""Shared pytest fixtures for isolated API tests."""

from collections.abc import AsyncGenerator, AsyncIterable, Callable, Generator
from pathlib import Path
from uuid import UUID

import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, create_engine

from app.api.deps import get_file_service
from app.auth.deps import get_current_user
from app.auth.schemas import CurrentUser
from app.core.file_service import FileService
from app.core.storage.base import BaseStorage
from app.database import get_db_session
from app.main import app

USER_ID = UUID("11111111-1111-1111-1111-111111111111")
OTHER_USER_ID = UUID("22222222-2222-2222-2222-222222222222")
SUPERUSER_ID = UUID("33333333-3333-3333-3333-333333333333")


class TemporaryStorage(BaseStorage):
    """Storage implementation scoped to one test's temporary directory."""

    def __init__(self, root: Path) -> None:
        self.root = root

    async def save(self, path: str, stream: AsyncIterable[bytes]) -> None:
        target = self.root / path
        target.parent.mkdir(parents=True, exist_ok=True)
        with target.open("wb") as destination:
            async for chunk in stream:
                destination.write(chunk)

    def get_file(self, path: str) -> Path:
        return self.root / path

    async def get_stream(self, path: str) -> AsyncGenerator[bytes, None]:
        with (self.root / path).open("rb") as source:
            while chunk := source.read(1024):
                yield chunk

    def remove(self, path: str) -> None:
        (self.root / path).unlink(missing_ok=True)


@pytest.fixture
def regular_user() -> CurrentUser:
    return CurrentUser(id=USER_ID, email="user@example.com")


@pytest.fixture
def other_user() -> CurrentUser:
    return CurrentUser(id=OTHER_USER_ID, email="other@example.com")


@pytest.fixture
def superuser() -> CurrentUser:
    return CurrentUser(
        id=SUPERUSER_ID, email="admin@example.com", is_superuser=True
    )


@pytest.fixture
def file_client(tmp_path: Path) -> Generator[tuple[TestClient, object], None, None]:
    """Create a FastAPI client backed by a per-test SQLite DB and storage."""
    engine = create_engine(
        f"sqlite:///{tmp_path / 'files.db'}",
        connect_args={"check_same_thread": False},
    )
    SQLModel.metadata.create_all(engine)
    storage = TemporaryStorage(tmp_path / "uploads")

    def get_test_file_service() -> Generator[FileService, None, None]:
        with Session(engine) as session:
            yield FileService(session, storage)

    def get_test_db_session() -> Generator[Session, None, None]:
        with Session(engine) as session:
            yield session

    app.dependency_overrides.clear()
    app.dependency_overrides[get_file_service] = get_test_file_service
    app.dependency_overrides[get_db_session] = get_test_db_session
    with TestClient(app) as test_client:
        yield test_client, engine
    app.dependency_overrides.clear()
    engine.dispose()


@pytest.fixture
def authenticate_as() -> Generator[Callable[[CurrentUser], None], None, None]:
    """Override bearer-token validation with a chosen authenticated user."""

    def authenticate(user: CurrentUser) -> None:
        app.dependency_overrides[get_current_user] = lambda: user

    yield authenticate
    app.dependency_overrides.pop(get_current_user, None)


@pytest.fixture
def as_user(
    file_client: tuple[TestClient, object],
    authenticate_as: Callable[[CurrentUser], None],
    regular_user: CurrentUser,
) -> tuple[TestClient, object]:
    authenticate_as(regular_user)
    return file_client


@pytest.fixture
def as_other_user(
    file_client: tuple[TestClient, object],
    authenticate_as: Callable[[CurrentUser], None],
    other_user: CurrentUser,
) -> tuple[TestClient, object]:
    authenticate_as(other_user)
    return file_client


@pytest.fixture
def as_superuser(
    file_client: tuple[TestClient, object],
    authenticate_as: Callable[[CurrentUser], None],
    superuser: CurrentUser,
) -> tuple[TestClient, object]:
    authenticate_as(superuser)
    return file_client
