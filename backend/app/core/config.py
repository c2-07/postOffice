from pydantic import Field
from typing import Annotated
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    API_BASE_URL: Annotated[str, Field(description="Base API url")] = (
        "http://localhost:8000"
    )
    FRONTEND_BASE_URL: Annotated[str, Field(description="Frontend URL")] = (
        "http://localhost:8080"
    )
    DATABASE_URL: Annotated[str, Field(description="Base database url")] = (
        "sqlite:///database.db"
    )

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

    BACKEND_CORS_ORIGINS: str = "*"


settings = Settings()

__all__ = ["settings"]
