"""Public signup and login endpoints."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.auth.deps import CurrentUserDeps, SuperuserDeps
from app.auth.schemas import (
    AuthResponse,
    CurrentUser,
    LoginRequest,
    RoleUpdateRequest,
    SignUpRequest,
    UserResponse,
)
from app.auth.service import AuthService, get_auth_service

router = APIRouter(prefix="/auth", tags=["auth"])

AuthServiceDeps = Annotated[AuthService, Depends(get_auth_service)]


@router.post("/signup", status_code=status.HTTP_201_CREATED, response_model=AuthResponse)
def signup(payload: SignUpRequest, service: AuthServiceDeps) -> AuthResponse:
    """Create an account; a session is absent when email confirmation is enabled."""
    return service.signup(payload.email, payload.password)


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, service: AuthServiceDeps) -> AuthResponse:
    """Authenticate credentials and return tokens."""
    return service.login(payload.email, payload.password)


@router.get("/me", response_model=CurrentUser)
def me(user: CurrentUserDeps) -> CurrentUser:
    """Return the identity represented by the verified bearer token."""
    return user


@router.patch("/users/{user_id}/role", response_model=UserResponse)
def update_role(
    user_id: UUID,
    payload: RoleUpdateRequest,
    _: SuperuserDeps,
    service: AuthServiceDeps,
) -> UserResponse:
    """Set a user's server-controlled authorization role."""
    return service.update_role(user_id, payload.role)
