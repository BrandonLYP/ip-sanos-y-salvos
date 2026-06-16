"""Dependencias compartidas (autenticación, etc.)."""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.core.security import decode_token
from app.core.storage import get_table

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=True)


def _find_user(user_id: int) -> dict | None:
    for u in get_table("usuarios"):
        if u["id"] == user_id and u.get("activo", True):
            return u
    return None


def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No autenticado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exc
    except ValueError:
        raise credentials_exc

    user = _find_user(int(user_id))
    if user is None:
        raise credentials_exc
    return user
