from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Vishwas AI - Smarter Credit Assessment for Every MSME"
    app_version: str = "0.1.0"
    environment: str = "development"

    database_url: str = "sqlite:///./msme_health.db"

    mistral_api_key: str | None = None
    mistral_model: str = "mistral-large-latest"

    jwt_secret_key: str = Field(default="change_this_secret")
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    collateral_free_loan_threshold: int = 2_000_000

    cors_origins: list[str] = ["*"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
