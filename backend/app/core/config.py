from typing import Annotated

from pydantic import Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

__all__ = ["Settings", "settings"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    API_BASE_URL: Annotated[str, Field(description="Base API url")] = (
        "http://localhost:8000"
    )
    FRONTEND_BASE_URL: Annotated[str, Field(description="Frontend URL")] = (
        "http://localhost:8080"
    )
    DATABASE_URL: Annotated[str, Field(description="Base database url")] = (
        "sqlite:///database.db"
    )

    @model_validator(mode="after")
    def fix_database_url(self) -> "Settings":
        return self

    DEBUG: Annotated[bool, Field(description="Debug Mode (default: False)")] = False

    UPLOAD_DIR: Annotated[
        str, Field(description="Base directory for saving uploaded files")
    ] = "uploads"
    MAX_UPLOAD_SIZE: Annotated[
        int, Field(description="Max allowed filesize to upload")
    ] = 1024 * 1024 * 50  # 50 MB
    CHUNK_SIZE: Annotated[
        int, Field(description="Max bytes to read from bytes stream (Uploadfile)")
    ] = 1024 * 1024 * 2  # 2 MB

    JWT_SECRET_KEY: str = "your-super-secret-jwt-key"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    BACKEND_CORS_ORIGINS: list[str] = []


settings = Settings()
