"""Módulo de IA: matching por similitud de imagen (imagehash)."""

from __future__ import annotations

import io
from functools import lru_cache

from PIL import Image
import imagehash


@lru_cache(maxsize=1)
def _hasher():
    return imagehash.average_hash


def compute_hash(image_path_or_bytes) -> str:
    """Calcula el perceptual hash de una imagen.

    Acepta una ruta a archivo o bytes.
    """
    if isinstance(image_path_or_bytes, (bytes, bytearray, memoryview)):
        img = Image.open(io.BytesIO(image_path_or_bytes))
    else:
        img = Image.open(image_path_or_bytes)
    return str(imagehash.average_hash(img))


def similarity(hash_a: str, hash_b: str) -> float:
    """Devuelve un porcentaje 0-100 de similitud entre dos hashes."""
    if not hash_a or not hash_b:
        return 0.0
    try:
        a = imagehash.hex_to_hash(hash_a)
        b = imagehash.hex_to_hash(hash_b)
        distance = (a - b) if (a - b) >= 0 else 0
        return max(0.0, 100.0 - distance * 5.0)
    except Exception:
        return 0.0
