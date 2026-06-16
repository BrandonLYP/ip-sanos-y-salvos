"""Schemas de autenticación."""

import re

from pydantic import BaseModel, Field, field_validator


_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _validate_email(value: str) -> str:
    if not _EMAIL_RE.match(value):
        raise ValueError("Email inválido")
    return value.lower()


class RegisterIn(BaseModel):
    nombre: str = Field(min_length=2, max_length=120)
    email: str
    password: str = Field(min_length=6, max_length=128)
    telefono: str | None = Field(default=None, max_length=30)

    @field_validator("email")
    @classmethod
    def _check_email(cls, v: str) -> str:
        return _validate_email(v)


class LoginIn(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def _check_email(cls, v: str) -> str:
        return _validate_email(v)


class UserOut(BaseModel):
    id: int
    nombre: str
    email: str
    telefono: str | None
    rol: str
    activo: bool


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
