"""Estadísticas calculadas desde la BD JSON."""

from collections import Counter, defaultdict
from datetime import datetime, timedelta

from fastapi import APIRouter

from app.core.storage import get_table

router = APIRouter(prefix="/stats", tags=["Stats"])

_MONTHS_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]


@router.get("/mensual")
def stats_mensual() -> list[dict]:
    """Últimos 6 meses: perdidas, encontradas, recuperadas."""
    rows = get_table("mascotas")

    buckets: dict[str, dict[str, int]] = defaultdict(
        lambda: {"perdidas": 0, "encontradas": 0, "recuperadas": 0}
    )

    for m in rows:
        fecha_str = m.get("created_at") or m.get("fecha")
        if not fecha_str:
            continue
        try:
            dt = datetime.fromisoformat(fecha_str)
        except ValueError:
            continue
        key = f"{dt.year:04d}-{dt.month:02d}"
        buckets[key]["perdidas" if m["tipo"] == "perdida" else "encontradas"] += 1
        if m.get("estado") == "recuperada":
            buckets[key]["recuperadas"] += 1

    now = datetime.utcnow()
    out: list[dict] = []
    cursor = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    for _ in range(6):
        key = f"{cursor.year:04d}-{cursor.month:02d}"
        label = _MONTHS_ES[cursor.month - 1]
        data = buckets.get(key, {"perdidas": 0, "encontradas": 0, "recuperadas": 0})
        out.append({"mes": label, **data})
        # ir al mes anterior
        prev_month = cursor.month - 1
        prev_year = cursor.year
        if prev_month == 0:
            prev_month = 12
            prev_year -= 1
        cursor = cursor.replace(year=prev_year, month=prev_month)
    out.reverse()
    return out


@router.get("/especies")
def stats_especies() -> list[dict]:
    """% por especie."""
    rows = get_table("mascotas")
    if not rows:
        return [
            {"name": "Perros", "value": 0, "color": "#065A82"},
            {"name": "Gatos", "value": 0, "color": "#02C39A"},
            {"name": "Otros", "value": 0, "color": "#A8D8EA"},
        ]
    counter = Counter((m.get("especie") or "Otro").capitalize() for m in rows)
    total = sum(counter.values())
    palette = {"Perro": "#065A82", "Gato": "#02C39A", "Otro": "#A8D8EA"}
    out = []
    for esp, n in counter.most_common():
        out.append(
            {
                "name": esp if esp in palette else "Otro",
                "value": round(n * 100 / total),
                "color": palette.get(esp, "#A8D8EA"),
            }
        )
    return out


@router.get("/resumen")
def resumen() -> dict:
    """KPIs para el dashboard."""
    rows = get_table("mascotas")
    total = len(rows)
    activas = sum(1 for m in rows if m.get("estado") == "activa")
    recuperadas = sum(1 for m in rows if m.get("estado") == "recuperada")
    return {
        "total": total,
        "activas": activas,
        "recuperadas": recuperadas,
        "tasa_recuperacion": round(recuperadas * 100 / total) if total else 0,
    }
