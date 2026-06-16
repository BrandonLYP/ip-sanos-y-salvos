"""Schemas de Mascota."""

from datetime import date
from typing import Literal

from pydantic import BaseModel, Field


class MascotaIn(BaseModel):
    tipo: Literal["perdida", "encontrada"]
    nombre: str = Field(default="Sin nombre", max_length=120)
    especie: str = Field(min_length=2, max_length=40)
    raza: str | None = Field(default=None, max_length=80)
    color: str | None = Field(default=None, max_length=80)
    sexo: Literal["Macho", "Hembra", "Desconocido"] = "Desconocido"
    edad: str | None = Field(default=None, max_length=40)
    zona: str | None = Field(default=None, max_length=120)
    lat: float | None = None
    lng: float | None = None
    descripcion: str | None = None
    contacto: str | None = Field(default=None, max_length=60)
    foto_url: str | None = Field(default=None, max_length=255)


class MascotaUpdateEstado(BaseModel):
    estado: Literal["activa", "recuperada", "cerrada"]


class MascotaOut(BaseModel):
    id: int
    usuario_id: int
    tipo: str
    nombre: str
    especie: str
    raza: str | None
    color: str | None
    sexo: str
    edad: str | None
    zona: str | None
    lat: float | None
    lng: float | None
    descripcion: str | None
    contacto: str | None
    foto_url: str | None
    estado: str
    fecha: date
    match: float = 0.0
