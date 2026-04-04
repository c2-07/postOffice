from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict()
    UPLOAD_DIR: str = Field(
        default="uploads", description="Path where uploaded files are stored"
    )
    MAX_UPLOAD_SIZE: int = Field(
        default=10 * 1024 * 1024 * 1024,  # 10GB written clearly
        description="Maximum file size in bytes",
    )


settings = Settings()

__all__ = ["settings"]
