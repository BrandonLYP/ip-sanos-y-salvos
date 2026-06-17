"""Persistencia simple en JSON para el MVP.

Cada tabla se guarda como una lista de dicts. La ruta se lee de
DATABASE_URL (formato json://<ruta>; //<ruta> = absoluto,
./<ruta> o <ruta> = relativo al cwd). Default: data/db.json.
Migrar a SQLAlchemy/PostgreSQL reemplazando este módulo.
"""

from __future__ import annotations

import json
import os
import threading
from datetime import date, datetime
from pathlib import Path
from typing import Any


def _resolve_data_file() -> Path:
    url = os.getenv("DATABASE_URL", "json://data/db.json")
    if url.startswith("json://"):
        path = url[len("json://") :]
    else:
        path = url
    return Path(path)


DATA_FILE = _resolve_data_file()
_lock = threading.Lock()


def _default_data() -> dict[str, list[dict]]:
    return {"usuarios": [], "mascotas": [], "avistamientos": []}


def _ensure_file() -> None:
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    if not DATA_FILE.exists():
        DATA_FILE.write_text(json.dumps(_default_data(), indent=2), encoding="utf-8")


def _serialize(value: Any) -> Any:
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    return value


def _deserialize(value: Any) -> Any:
    return value


def read_all() -> dict[str, list[dict]]:
    _ensure_file()
    with _lock:
        # utf-8-sig strips a leading BOM if the file was edited externally
        # (Notepad, PowerShell Out-File, etc.).
        return json.loads(DATA_FILE.read_text(encoding="utf-8-sig"))


def write_all(data: dict[str, list[dict]]) -> None:
    _ensure_file()
    with _lock:
        serializable = {
            k: [{_serialize(k2): _serialize(v2) for k2, v2 in row.items()} for row in rows]
            for k, rows in data.items()
        }
        DATA_FILE.write_text(json.dumps(serializable, indent=2, ensure_ascii=False), encoding="utf-8")


def get_table(name: str) -> list[dict]:
    return read_all().get(name, [])


def set_table(name: str, rows: list[dict]) -> None:
    data = read_all()
    data[name] = rows
    write_all(data)


def next_id(rows: list[dict]) -> int:
    return (max((r["id"] for r in rows), default=0)) + 1
