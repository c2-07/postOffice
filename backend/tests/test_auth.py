from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.testclient import TestClient

from app.auth.deps import decode_access_token, get_current_user, require_superuser
from app.auth.schemas import CurrentUser
from app.api.routes.auth import get_auth_service
from app.main import app


class FakeAuthService:
    def __init__(self) -> None:
        self.user = SimpleNamespace(id=uuid4(), email="ada@example.com", created_at=None)

    def signup(self, email: str, password: str):
        assert email == "ada@example.com"
        assert password == "safe-password-123"
        return {
            "user": {"id": str(self.user.id), "email": email, "email_confirmed_at": None},
            "access_token": None,
            "refresh_token": None,
            "token_type": None,
            "expires_in": None,
        }

    def login(self, email: str, password: str):
        assert email == "ada@example.com"
        assert password == "safe-password-123"
        return {
            "user": {"id": str(self.user.id), "email": email, "email_confirmed_at": None},
            "access_token": "access-token",
            "refresh_token": "refresh-token",
            "token_type": "bearer",
            "expires_in": 3600,
        }

    def update_role(self, user_id, role: str):
        return {
            "id": str(user_id),
            "email": self.user.email,
            "email_confirmed_at": None,
        }


@pytest.fixture
def fake_auth_service():
    return FakeAuthService()


@pytest.fixture
def client(fake_auth_service):
    app.dependency_overrides[get_auth_service] = lambda: fake_auth_service
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_signup_returns_user_and_optional_session(client, fake_auth_service):
    response = client.post(
        "/auth/signup",
        json={"email": "ada@example.com", "password": "safe-password-123"},
    )

    assert response.status_code == 201
    assert response.json()["user"]["email"] == "ada@example.com"


def test_login_returns_access_tokens(client, fake_auth_service):
    response = client.post(
        "/auth/login",
        json={"email": "ada@example.com", "password": "safe-password-123"},
    )

    assert response.status_code == 200
    assert response.json()["access_token"] == "access-token"


def test_login_invalid_credentials_are_unauthorized(client, fake_auth_service):
    from fastapi import HTTPException

    def reject_login(email: str, password: str):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    fake_auth_service.login = reject_login
    response = client.post(
        "/auth/login",
        json={"email": "ada@example.com", "password": "wrong-password"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


def test_credentials_are_validated(client):
    response = client.post(
        "/auth/signup", json={"email": "not-an-email", "password": "short"}
    )
    assert response.status_code == 422


def test_me_without_bearer_token_is_401(client):
    response = client.get("/auth/me")

    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


def test_me_with_malformed_authorization_is_401(client):
    response = client.get("/auth/me", headers={"Authorization": "Basic not-a-token"})

    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


def test_current_user_reads_subject_and_role_from_verified_claims(monkeypatch):
    user_id = uuid4()
    monkeypatch.setattr(
        "app.auth.deps.decode_access_token",
        lambda token: {
            "sub": str(user_id),
            "email": "ada@example.com",
            "role": "superuser",
        },
    )

    user = get_current_user(
        HTTPAuthorizationCredentials(scheme="Bearer", credentials="token")
    )

    assert user.id == user_id
    assert user.email == "ada@example.com"
    assert user.is_superuser is True


def test_regular_user_cannot_use_superuser_dependency():
    with pytest.raises(HTTPException) as error:
        require_superuser(
            CurrentUser(id=uuid4(), email="ada@example.com", is_superuser=False)
        )

    assert error.value.status_code == 403


def test_role_update_requires_superuser(client, fake_auth_service):
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(
        id=uuid4(), email="ada@example.com", is_superuser=False
    )

    response = client.patch(
        f"/auth/users/{uuid4()}/role", json={"role": "superuser"}
    )

    assert response.status_code == 403


def test_superuser_can_update_role(client, fake_auth_service):
    user_id = uuid4()
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(
        id=uuid4(), email="admin@example.com", is_superuser=True
    )

    response = client.patch(f"/auth/users/{user_id}/role", json={"role": "superuser"})

    assert response.status_code == 200
    assert response.json()["id"] == str(user_id)
