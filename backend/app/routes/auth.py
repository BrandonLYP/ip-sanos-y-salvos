"""Rutas de autenticación."""

from datetime import datetime

from fastapi import APIRouter, HTTPException, status

from app.core.security import create_access_token, hash_password, verify_password
from app.core.storage import get_table, next_id, set_table
from app.schemas.auth import LoginIn, RegisterIn, TokenOut, UserOut

router = APIRouter(prefix="/auth", tags=["Auth"])


def _to_user(row: dict) -> UserOut:
    return UserOut(
        id=row["id"],
        nombre=row["nombre"],
        email=row["email"],
        telefono=row.get("telefono"),
        rol=row.get("rol", "dueno"),
        activo=row.get("activo", True),
    )


@router.post("/register", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterIn) -> TokenOut:
    users = get_table("usuarios")
    if any(u["email"].lower() == payload.email.lower() for u in users):
        raise HTTPException(status_code=409, detail="El email ya está registrado")

    new_user = {
        "id": next_id(users),
        "nombre": payload.nombre,
        "email": payload.email.lower(),
        "password_hash": hash_password(payload.password),
        "telefono": payload.telefono,
        "rol": "dueno",
        "activo": True,
        "created_at": datetime.utcnow().isoformat(),
    }
    users.append(new_user)
    set_table("usuarios", users)

    token = create_access_token(new_user["id"])
    return TokenOut(access_token=token, user=_to_user(new_user))


@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn) -> TokenOut:
    user = next(
        (u for u in get_table("usuarios") if u["email"].lower() == payload.email.lower()),
        None,
    )
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    if not user.get("activo", True):
        raise HTTPException(status_code=403, detail="Usuario deshabilitado")

    token = create_access_token(user["id"])
    return TokenOut(access_token=token, user=_to_user(user))
