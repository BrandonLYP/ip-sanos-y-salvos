"""Schemas Pydantic (entrada/salida de la API)."""

from app.schemas.auth import LoginIn, RegisterIn, TokenOut, UserOut
from app.schemas.avistamiento import AvistamientoIn, AvistamientoOut
from app.schemas.mascota import MascotaIn, MascotaOut, MascotaUpdateEstado

__all__ = [
    "LoginIn",
    "RegisterIn",
    "TokenOut",
    "UserOut",
    "AvistamientoIn",
    "AvistamientoOut",
    "MascotaIn",
    "MascotaOut",
    "MascotaUpdateEstado",
]
