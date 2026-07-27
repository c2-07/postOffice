"""Request and response models for authentication endpoints."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class SignUpRequest(BaseModel):
    """Credentials used to create an account."""

    email: EmailStr
    password: str = Field(
        min_length=8,
        max_length=72,
        repr=False,
        json_schema_extra={"writeOnly": True},
    )


class LoginRequest(SignUpRequest):
    """Credentials used to obtain a session."""


class RoleUpdateRequest(BaseModel):
    role: Literal["user", "superuser"]


class CurrentUser(BaseModel):
    """Identity derived from a verified access token."""

    id: UUID
    email: EmailStr | None = None
    is_superuser: bool = False


class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    email_confirmed_at: datetime | None = None


class AuthResponse(BaseModel):
    """A user and a session token."""

    user: UserResponse
    access_token: str | None = None
    refresh_token: str | None = None
    token_type: str | None = None
    expires_in: int | None = None
