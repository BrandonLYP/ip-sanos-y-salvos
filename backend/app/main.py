"""Punto de entrada FastAPI."""

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core import get_settings
from app.core.storage import DATA_FILE, get_table
from app.routes import (
    auth_router,
    avistamientos_router,
    mascotas_router,
    stats_router,
    uploads_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    if not DATA_FILE.exists():
        DATA_FILE.write_text('{"usuarios": [], "mascotas": [], "avistamientos": []}', encoding="utf-8")
    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
    _maybe_seed()
    yield


def _maybe_seed() -> None:
    """Sembrar datos demo si la BD esta vacia (deploy fresco en Render)."""
    if get_table("usuarios"):
        return
    try:
        from seed import run

        run()
    except Exception as exc:  # noqa: BLE001
        # No bloquear el arranque del server si el seed falla.
        print(f"[startup] seed omitido: {exc}")


settings = get_settings()
app = FastAPI(title=settings.api_title, version=settings.api_version, lifespan=lifespan)


settings = get_settings()
app = FastAPI(title=settings.api_title, version=settings.api_version, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
app.mount("/media", StaticFiles(directory=settings.upload_dir), name="media")

app.include_router(auth_router)
app.include_router(mascotas_router)
app.include_router(avistamientos_router)
app.include_router(stats_router)
app.include_router(uploads_router)


@app.get("/")
def root() -> dict:
    return {
        "mensaje": "API Sanos y Salvos funcionando",
        "version": settings.api_version,
        "docs": "/docs",
    }


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
