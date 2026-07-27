"""Dependencies for validating access tokens and authorization roles."""

from typing import Annotated, Any
from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth.schemas import CurrentUser
from app.core.config import settings

_bearer_scheme = HTTPBearer(auto_error=False)


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def decode_access_token(token: str) -> dict[str, Any]:
    """Decode a JWT access token."""
    try:
        return jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except jwt.PyJWTError as error:
        raise _unauthorized("Invalid or expired access token") from error


def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(_bearer_scheme)
    ],
) -> CurrentUser:
    """Return a user identity derived solely from verified JWT claims."""
    if (
        credentials is None
        or credentials.scheme.lower() != "bearer"
        or not credentials.credentials
    ):
        raise _unauthorized("Not authenticated")

    claims = decode_access_token(credentials.credentials)
    try:
        user_id = UUID(str(claims["sub"]))
    except (KeyError, TypeError, ValueError) as error:
        raise _unauthorized("Invalid or expired access token") from error

    role = claims.get("role")
    email = claims.get("email")
    return CurrentUser(
        id=user_id,
        email=email if isinstance(email, str) else None,
        is_superuser=role == "superuser",
    )


CurrentUserDeps = Annotated[CurrentUser, Depends(get_current_user)]


def require_superuser(user: CurrentUserDeps) -> CurrentUser:
    """Reject authenticated callers without the server-controlled superuser role."""
    if not user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superuser privileges required",
        )
    return user


SuperuserDeps = Annotated[CurrentUser, Depends(require_superuser)]
