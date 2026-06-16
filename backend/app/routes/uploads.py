"""Subida de imágenes."""

import os
import uuid
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.core import get_settings

router = APIRouter(prefix="/uploads", tags=["Uploads"])


@router.post("/")
async def upload_imagen(file: UploadFile = File(...)) -> dict:
    settings = get_settings()
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="El archivo debe ser una imagen")

    ext = os.path.splitext(file.filename or "")[1].lower() or ".jpg"
    if ext not in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
        raise HTTPException(status_code=400, detail="Formato no permitido")

    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)

    contents = await file.read()
    max_bytes = settings.max_upload_mb * 1024 * 1024
    if len(contents) > max_bytes:
        raise HTTPException(status_code=413, detail=f"Imagen supera {settings.max_upload_mb} MB")

    name = f"{uuid.uuid4().hex}{ext}"
    dest = upload_dir / name
    dest.write_bytes(contents)

    return {"filename": name, "url": f"/media/{name}"}
