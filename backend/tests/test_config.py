import pytest

from app.core.config import Settings


def test_jwt_configuration_has_defaults():
    settings = Settings()
    assert settings.JWT_SECRET_KEY is not None
    assert settings.JWT_ALGORITHM == "HS256"
