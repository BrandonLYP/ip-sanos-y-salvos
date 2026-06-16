"""Seed de datos de demostración (idempotente)."""

from datetime import date, datetime, timezone

from app.core.security import hash_password
from app.core.storage import get_table, set_table

SEED_USER = {
    "nombre": "Usuario Demo",
    "email": "demo@sanosysalvos.cl",
    "password": "demo1234",
    "rol": "dueno",
}

SEED_MASCOTAS = [
    {
        "tipo": "perdida",
        "nombre": "Luna",
        "especie": "Perro",
        "raza": "Labrador",
        "color": "Amarillo",
        "sexo": "Hembra",
        "edad": "3 años",
        "zona": "Providencia",
        "lat": -33.4242,
        "lng": -70.6065,
        "descripcion": "Collar azul, muy amigable",
        "contacto": "9 8765 4321",
        "estado": "activa",
    },
    {
        "tipo": "encontrada",
        "nombre": "Sin nombre",
        "especie": "Perro",
        "raza": "Mestizo",
        "color": "Café oscuro",
        "sexo": "Hembra",
        "edad": "Adulto",
        "zona": "Providencia",
        "lat": -33.4250,
        "lng": -70.6080,
        "descripcion": "Encontrada cerca del metro Baquedano, sin collar",
        "contacto": "9 5555 2222",
        "estado": "activa",
    },
    {
        "tipo": "perdida",
        "nombre": "Coco",
        "especie": "Perro",
        "raza": "Beagle",
        "color": "Tricolor",
        "sexo": "Macho",
        "edad": "5 años",
        "zona": "Ñuñoa",
        "lat": -33.4569,
        "lng": -70.5950,
        "descripcion": "Lleva chip, responde a su nombre",
        "contacto": "9 9999 1111",
        "estado": "activa",
    },
    {
        "tipo": "encontrada",
        "nombre": "Sin nombre",
        "especie": "Gato",
        "raza": "Común europeo",
        "color": "Negro",
        "sexo": "Macho",
        "edad": "Joven",
        "zona": "Santiago Centro",
        "lat": -33.4489,
        "lng": -70.6693,
        "descripcion": "Muy asustado, en casa temporal",
        "contacto": "9 3333 7777",
        "estado": "activa",
    },
    {
        "tipo": "perdida",
        "nombre": "Simba",
        "especie": "Gato",
        "raza": "Persa",
        "color": "Naranja",
        "sexo": "Macho",
        "edad": "4 años",
        "zona": "Vitacura",
        "lat": -33.3900,
        "lng": -70.5700,
        "descripcion": "Muy peludo, esterilizado, collar rojo",
        "contacto": "9 6666 8888",
        "estado": "recuperada",
    },
]


def run() -> None:
    users = get_table("usuarios")
    if not any(u["email"] == SEED_USER["email"] for u in users):
        user_row = {
            "id": (max((u["id"] for u in users), default=0)) + 1,
            "nombre": SEED_USER["nombre"],
            "email": SEED_USER["email"],
            "password_hash": hash_password(SEED_USER["password"]),
            "telefono": None,
            "rol": SEED_USER["rol"],
            "activo": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        users.append(user_row)
        set_table("usuarios", users)
        print(f"[OK] Usuario demo creado: {SEED_USER['email']} / {SEED_USER['password']}")
        demo_id = user_row["id"]
    else:
        demo_id = next(u["id"] for u in users if u["email"] == SEED_USER["email"])
        print(f"[skip] Usuario demo ya existe: {SEED_USER['email']}")

    mascotas = get_table("mascotas")
    existing_names = {m["nombre"] for m in mascotas}
    added = 0
    for data in SEED_MASCOTAS:
        if data["nombre"] in existing_names and data["estado"] != "recuperada":
            continue
        today = date.today().isoformat()
        new_row = {
            "id": (max((m["id"] for m in mascotas), default=0)) + 1,
            "usuario_id": demo_id,
            "image_hash": None,
            "fecha": today,
            "created_at": today,
            **data,
        }
        mascotas.append(new_row)
        added += 1
    set_table("mascotas", mascotas)
    print(f"[OK] {added} mascotas agregadas")


if __name__ == "__main__":
    run()
