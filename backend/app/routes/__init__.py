"""Rutas de la API."""

from app.routes.auth import router as auth_router
from app.routes.avistamientos import router as avistamientos_router
from app.routes.mascotas import router as mascotas_router
from app.routes.stats import router as stats_router
from app.routes.uploads import router as uploads_router

__all__ = [
    "auth_router",
    "mascotas_router",
    "avistamientos_router",
    "stats_router",
    "uploads_router",
]
