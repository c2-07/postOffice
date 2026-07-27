"""A small, testable wrapper around standard JWT Auth."""

from datetime import datetime, timedelta, timezone
from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, status
from passlib.context import CryptContext
from sqlmodel import Session, select

from app.auth.schemas import AuthResponse, UserResponse
from app.core.config import settings
from app.database import get_db_session
from app.models import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    """Perform auth operations against SQLite."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def signup(self, email: str, password: str) -> AuthResponse:
        existing = self.session.exec(select(User).where(User.email == email)).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )
        hashed = pwd_context.hash(password)
        user = User(email=email, hashed_password=hashed)
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        return self._to_auth_response(user)

    def login(self, email: str, password: str) -> AuthResponse:
        user = self.session.exec(select(User).where(User.email == email)).first()
        if not user or not pwd_context.verify(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )
        return self._to_auth_response(user)

    def update_role(self, user_id: UUID, role: str) -> UserResponse:
        user = self.session.get(User, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        user.role = role
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        return self._to_user_response(user)

    def create_access_token(self, subject: str, role: str) -> str:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode = {"exp": expire, "sub": str(subject), "role": role, "email": ""}
        # Also need email in claims if we want to return CurrentUser with email. Let's fetch it or just embed it.
        return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

    def _to_auth_response(self, user: User) -> AuthResponse:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode = {"exp": expire, "sub": str(user.id), "role": user.role, "email": user.email}
        access_token = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

        return AuthResponse(
            user=self._to_user_response(user),
            access_token=access_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    @staticmethod
    def _to_user_response(user: User) -> UserResponse:
        return UserResponse(
            id=user.id,
            email=user.email,
            email_confirmed_at=user.created_at,
        )


def get_auth_service(session: Session = Depends(get_db_session)) -> AuthService:
    return AuthService(session)
