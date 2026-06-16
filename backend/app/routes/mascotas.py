"""Rutas de mascotas (CRUD + matching)."""

import os
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core import get_settings
from app.core.deps import get_current_user
from app.core.storage import get_table, next_id, set_table
from app.ia.matching import compute_hash, similarity
from app.schemas.mascota import MascotaIn, MascotaOut, MascotaUpdateEstado

router = APIRouter(prefix="/mascotas", tags=["Mascotas"])


def _to_out(m: dict, match_score: float = 0.0) -> MascotaOut:
    return MascotaOut(match=match_score, **m)


@router.get("/", response_model=list[MascotaOut])
def listar(
    tipo: Optional[str] = Query(default=None),
    estado: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    limit: int = Query(default=100, ge=1, le=200),
) -> list[MascotaOut]:
    rows = get_table("mascotas")
    if tipo:
        rows = [m for m in rows if m.get("tipo") == tipo]
    if estado:
        rows = [m for m in rows if m.get("estado") == estado]
    if search:
        s = search.lower()
        rows = [
            m
            for m in rows
            if s in (m.get("nombre") or "").lower()
            or s in (m.get("zona") or "").lower()
            or s in (m.get("raza") or "").lower()
            or s in (m.get("color") or "").lower()
        ]
    rows = sorted(rows, key=lambda m: m.get("created_at", ""), reverse=True)[:limit]
    return [_to_out(m) for m in rows]


@router.get("/matches", response_model=list[MascotaOut])
def get_matches() -> list[MascotaOut]:
    """Coincidencias: perdidas vs encontradas.

    Estrategia MVP:
    1. Si ambas tienen image_hash → similitud perceptual.
    2. Si no → soft match por especie + raza + zona + color.
    """
    all_rows = get_table("mascotas")
    perdidas = [m for m in all_rows if m.get("tipo") == "perdida" and m.get("estado") == "activa"]
    encontradas = [m for m in all_rows if m.get("tipo") == "encontrada" and m.get("estado") == "activa"]

    results: list[MascotaOut] = []
    for p in perdidas:
        for e in encontradas:
            score = 0.0
            if p.get("image_hash") and e.get("image_hash"):
                score = similarity(p["image_hash"], e["image_hash"])
            else:
                if p.get("especie") == e.get("especie"):
                    score += 30
                if p.get("raza") and e.get("raza") and p["raza"].lower() == e["raza"].lower():
                    score += 25
                if p.get("zona") and e.get("zona") and p["zona"].lower() == e["zona"].lower():
                    score += 25
                if p.get("color") and e.get("color") and p["color"].lower() == e["color"].lower():
                    score += 20
            if score >= 60:
                results.append(_to_out(p, match_score=round(score, 1)))
                break
    return results


@router.get("/{mascota_id}", response_model=MascotaOut)
def obtener(mascota_id: int) -> MascotaOut:
    m = next((m for m in get_table("mascotas") if m["id"] == mascota_id), None)
    if not m:
        raise HTTPException(status_code=404, detail="Mascota no encontrada")
    return _to_out(m)


@router.post("/", response_model=MascotaOut, status_code=201)
def crear(
    payload: MascotaIn,
    current: dict = Depends(get_current_user),
) -> MascotaOut:
    settings = get_settings()
    rows = get_table("mascotas")

    foto_url = payload.foto_url
    img_hash = None
    if foto_url:
        local_path = os.path.join(settings.upload_dir, os.path.basename(foto_url))
        if os.path.isfile(local_path):
            try:
                img_hash = compute_hash(local_path)
            except Exception:
                img_hash = None

    new_row = {
        "id": next_id(rows),
        "usuario_id": current["id"],
        "tipo": payload.tipo,
        "nombre": payload.nombre,
        "especie": payload.especie,
        "raza": payload.raza,
        "color": payload.color,
        "sexo": payload.sexo,
        "edad": payload.edad,
        "zona": payload.zona,
        "lat": payload.lat,
        "lng": payload.lng,
        "descripcion": payload.descripcion,
        "contacto": payload.contacto,
        "foto_url": foto_url,
        "image_hash": img_hash,
        "estado": "activa",
        "fecha": date.today().isoformat(),
        "created_at": date.today().isoformat(),
    }
    rows.append(new_row)
    set_table("mascotas", rows)
    return _to_out(new_row)


@router.patch("/{mascota_id}/estado", response_model=MascotaOut)
def actualizar_estado(
    mascota_id: int,
    payload: MascotaUpdateEstado,
    current: dict = Depends(get_current_user),
) -> MascotaOut:
    rows = get_table("mascotas")
    m = next((m for m in rows if m["id"] == mascota_id), None)
    if not m:
        raise HTTPException(status_code=404, detail="No encontrada")
    if m["usuario_id"] != current["id"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    m["estado"] = payload.estado
    set_table("mascotas", rows)
    return _to_out(m)
