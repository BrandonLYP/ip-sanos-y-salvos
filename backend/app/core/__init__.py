"""Configuración por variables de entorno (sin dependencias extra)."""

from __future__ import annotations

import os
from functools import lru_cache


class Settings:
    def __init__(self) -> None:
        self.database_url: str = os.getenv("DATABASE_URL", "json://data/db.json")
        self.secret_key: str = os.getenv("SECRET_KEY", "dev-secret-change-me-in-prod")
        self.algorithm: str = os.getenv("ALGORITHM", "HS256")
        self.access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
        self.allowed_origins: str = os.getenv("ALLOWED_ORIGINS", "*")
        self.upload_dir: str = os.getenv("UPLOAD_DIR", "media/uploads")
        self.max_upload_mb: int = int(os.getenv("MAX_UPLOAD_MB", "5"))
        self.api_title: str = os.getenv("API_TITLE", "Sanos y Salvos API")
        self.api_version: str = os.getenv("API_VERSION", "0.1.0")
        self.port: int = int(os.getenv("PORT", "8000"))

    @property
    def cors_origins(self) -> list[str]:
        if self.allowed_origins.strip() == "*":
            return ["*"]
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
