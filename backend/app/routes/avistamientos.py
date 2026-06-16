"""Rutas de avistamientos."""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException

from app.core.deps import get_current_user
from app.core.storage import get_table, next_id, set_table
from app.schemas.avistamiento import AvistamientoIn, AvistamientoOut

router = APIRouter(prefix="/mascotas/{mascota_id}/avistamientos", tags=["Avistamientos"])


@router.get("/", response_model=list[AvistamientoOut])
def listar(mascota_id: int) -> list[AvistamientoOut]:
    mascota = next((m for m in get_table("mascotas") if m["id"] == mascota_id), None)
    if not mascota:
        raise HTTPException(status_code=404, detail="Mascota no encontrada")
    rows = [a for a in get_table("avistamientos") if a["mascota_id"] == mascota_id]
    rows.sort(key=lambda a: a.get("created_at", ""), reverse=True)
    return [AvistamientoOut(**a) for a in rows]


@router.post("/", response_model=AvistamientoOut, status_code=201)
def crear(
    mascota_id: int,
    payload: AvistamientoIn,
    current: dict = Depends(get_current_user),
) -> AvistamientoOut:
    mascota = next((m for m in get_table("mascotas") if m["id"] == mascota_id), None)
    if not mascota:
        raise HTTPException(status_code=404, detail="Mascota no encontrada")

    rows = get_table("avistamientos")
    new_row = {
        "id": next_id(rows),
        "mascota_id": mascota_id,
        "usuario_id": current["id"],
        "nota": payload.nota,
        "foto_url": payload.foto_url,
        "lat": payload.lat,
        "lng": payload.lng,
        "created_at": datetime.utcnow().isoformat(),
    }
    rows.append(new_row)
    set_table("avistamientos", rows)
    return AvistamientoOut(**new_row)
