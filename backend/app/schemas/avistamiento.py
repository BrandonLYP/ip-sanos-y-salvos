"""Schemas de Avistamiento."""

from datetime import datetime

from pydantic import BaseModel, Field


class AvistamientoIn(BaseModel):
    nota: str | None = None
    foto_url: str | None = Field(default=None, max_length=255)
    lat: float | None = None
    lng: float | None = None


class AvistamientoOut(BaseModel):
    id: int
    mascota_id: int
    usuario_id: int
    nota: str | None
    foto_url: str | None
    lat: float | None
    lng: float | None
    created_at: datetime
