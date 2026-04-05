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


settings = Settings()

__all__ = ["settings"]
