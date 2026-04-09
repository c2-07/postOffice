from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuration settings for the PostOffice application."""

    model_config = SettingsConfigDict()
    UPLOAD_DIR: str = Field(
        default="uploads", description="Base directory for storing uploaded files"
    )
    MAX_UPLOAD_SIZE: int = Field(
        default=10 * 1024 * 1024 * 1024,  # 10GB written clearly
        description="Global limit for maximum allowable file size in bytes",
    )
    API_BASE_URL: str = Field(
        default="http://localhost:8000",
        description="Base URL used when building shareable links",
    )
    FRONTEND_BASE_URL: str = Field(
        default="http://localhost:8080",
        description="Frontend base URL used for public file page links",
    )
    CLEANUP_INTERVAL_SECONDS: int = Field(
        default=60,
        description="Worker interval for cleaning expired files",
    )


settings = Settings()

__all__ = ["settings"]
