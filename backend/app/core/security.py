"""Seguridad: hash de passwords (pbkdf2 stdlib) y tokens firmados (HMAC stdlib)."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time
from typing import Any

from app.core import get_settings

_ITERATIONS = 200_000
_SALT_BYTES = 16


def hash_password(plain: str) -> str:
    salt = hashlib.sha256(plain.encode("utf-8") + str(time.time()).encode()).digest()[:_SALT_BYTES]
    digest = hashlib.pbkdf2_hmac("sha256", plain.encode("utf-8"), salt, _ITERATIONS)
    return f"pbkdf2${_ITERATIONS}${base64.b64encode(salt).decode()}${base64.b64encode(digest).decode()}"


def verify_password(plain: str, stored: str) -> bool:
    try:
        algo, iters, salt_b64, hash_b64 = stored.split("$", 3)
        if algo != "pbkdf2":
            return False
        salt = base64.b64decode(salt_b64)
        expected = base64.b64decode(hash_b64)
        candidate = hashlib.pbkdf2_hmac(
            "sha256", plain.encode("utf-8"), salt, int(iters)
        )
        return hmac.compare_digest(candidate, expected)
    except Exception:
        return False


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def create_access_token(subject: int | str, extra: dict[str, Any] | None = None) -> str:
    settings = get_settings()
    header = {"alg": "HS256", "typ": "JWT"}
    now = int(time.time())
    payload: dict[str, Any] = {
        "sub": str(subject),
        "iat": now,
        "exp": now + settings.access_token_expire_minutes * 60,
    }
    if extra:
        payload.update(extra)

    header_b64 = _b64url(json.dumps(header, separators=(",", ":")).encode())
    payload_b64 = _b64url(json.dumps(payload, separators=(",", ":")).encode())
    signing_input = f"{header_b64}.{payload_b64}".encode()
    signature = hmac.new(
        settings.secret_key.encode("utf-8"), signing_input, hashlib.sha256
    ).digest()
    return f"{header_b64}.{payload_b64}.{_b64url(signature)}"


def decode_token(token: str) -> dict[str, Any]:
    settings = get_settings()
    try:
        header_b64, payload_b64, signature_b64 = token.split(".")
    except ValueError as exc:
        raise ValueError("Token inválido") from exc

    signing_input = f"{header_b64}.{payload_b64}".encode()
    expected = hmac.new(
        settings.secret_key.encode("utf-8"), signing_input, hashlib.sha256
    ).digest()
    try:
        provided = _b64url_decode(signature_b64)
    except Exception as exc:
        raise ValueError("Token inválido") from exc

    if not hmac.compare_digest(expected, provided):
        raise ValueError("Firma inválida")

    try:
        payload = json.loads(_b64url_decode(payload_b64))
    except Exception as exc:
        raise ValueError("Token inválido") from exc

    if int(payload.get("exp", 0)) < int(time.time()):
        raise ValueError("Token expirado")

    return payload
