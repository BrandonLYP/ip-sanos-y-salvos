"""Seed de datos de demostración (idempotente).

Carga:
  - 3 usuarios: demo (admin), maria y juan.
  - 5 mascotas demo originales (mismas que antes, asignadas a demo).
  - 4 mascotas adicionales para probar matching IA:
      * Par A (perceptual): 2 mascotas con foto sintetica de la misma
        "mascota" con variacion visual controlada (mismo perro, foto
        tomada con distinta luz/crop). Cruce de usuarios distintos.
      * Par B (metadatos):  2 mascotas sin foto con especie+raza+zona
        +color identicos. Cruce de usuarios distintos.
"""

from datetime import date, datetime, timezone
from pathlib import Path

from app.core.security import hash_password
from app.core.storage import get_table, set_table
from app.ia.matching import compute_hash

SEED_USERS = [
    {
        "nombre": "Usuario Demo",
        "email": "demo@sanosysalvos.cl",
        "password": "demo1234",
        "rol": "dueno",
    },
    {
        "nombre": "Maria Lopez",
        "email": "maria@sanosysalvos.cl",
        "password": "maria1234",
        "rol": "dueno",
    },
    {
        "nombre": "Juan Perez",
        "email": "juan@sanosysalvos.cl",
        "password": "juan1234",
        "rol": "dueno",
    },
]

SEED_MASCOTAS = [
    {
        "tipo": "perdida",
        "nombre": "Luna",
        "especie": "Perro",
        "raza": "Labrador",
        "color": "Amarillo",
        "sexo": "Hembra",
        "edad": "3 anios",
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
        "color": "Cafe oscuro",
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
        "edad": "5 anios",
        "zona": "Nunoa",
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
        "raza": "Comun europeo",
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
        "edad": "4 anios",
        "zona": "Vitacura",
        "lat": -33.3900,
        "lng": -70.5700,
        "descripcion": "Muy peludo, esterilizado, collar rojo",
        "contacto": "9 6666 8888",
        "estado": "recuperada",
    },
]

# Match IA: par A (perceptual).
# Reportadas por usuarios DISTINTOS para que el match cruce duenos.
SEED_MATCH_PHOTO = [
    {
        "owner_email": "maria@sanosysalvos.cl",
        "tipo": "perdida",
        "nombre": "Toby",
        "especie": "Perro",
        "raza": "Labrador",
        "color": "Dorado",
        "sexo": "Macho",
        "edad": "4 anios",
        "zona": "La Florida",
        "lat": -33.5510,
        "lng": -70.5880,
        "descripcion": "Labrador dorado, collar rojo, se escapo del jardin el lunes",
        "contacto": "+56 9 1111 2222",
        "estado": "activa",
        "asset": "a1.jpg",
    },
    {
        "owner_email": "juan@sanosysalvos.cl",
        "tipo": "encontrada",
        "nombre": "Toby (reconocido)",
        "especie": "Perro",
        "raza": "Labrador",
        "color": "Dorado",
        "sexo": "Macho",
        "edad": "Adulto",
        "zona": "La Florida",
        "lat": -33.5520,
        "lng": -70.5890,
        "descripcion": "Labrador dorado con collar rojo visto en plaza. Muy docil.",
        "contacto": "+56 9 3333 4444",
        "estado": "activa",
        "asset": "a2.jpg",
    },
]

# Match IA: par B (metadatos, sin foto).
SEED_MATCH_META = [
    {
        "owner_email": "maria@sanosysalvos.cl",
        "tipo": "perdida",
        "nombre": "Mishi",
        "especie": "Gato",
        "raza": "Siames",
        "color": "Crema con puntos cafes",
        "sexo": "Hembra",
        "edad": "2 anios",
        "zona": "Maipu",
        "lat": -33.5103,
        "lng": -70.7565,
        "descripcion": "Gata siames crema, ojos azules, muy asustada. Salio por la ventana.",
        "contacto": "+56 9 5555 6666",
        "estado": "activa",
    },
    {
        "owner_email": "juan@sanosysalvos.cl",
        "tipo": "encontrada",
        "nombre": "Sin nombre",
        "especie": "Gato",
        "raza": "Siames",
        "color": "Crema con puntos cafes",
        "sexo": "Hembra",
        "edad": "Joven",
        "zona": "Maipu",
        "lat": -33.5110,
        "lng": -70.7570,
        "descripcion": "Gata siames crema encontrada cerca del mall, sin collar.",
        "contacto": "+56 9 7777 8888",
        "estado": "activa",
    },
]

ASSET_DIR = Path(__file__).parent / "seed_assets"


def _upsert_user(users: list[dict], spec: dict) -> int:
    if not any(u["email"] == spec["email"] for u in users):
        user_row = {
            "id": (max((u["id"] for u in users), default=0)) + 1,
            "nombre": spec["nombre"],
            "email": spec["email"],
            "password_hash": hash_password(spec["password"]),
            "telefono": None,
            "rol": spec["rol"],
            "activo": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        users.append(user_row)
        set_table("usuarios", users)
        print(f"[OK] Usuario creado: {spec['email']} / {spec['password']}")
        return user_row["id"]
    return next(u["id"] for u in users if u["email"] == spec["email"])


def _add_mascota(mascotas: list[dict], owner_id: int, data: dict) -> dict | None:
    if any(m.get("nombre") == data["nombre"] and m.get("usuario_id") == owner_id for m in mascotas):
        return None
    asset_name = data.pop("asset", None)
    img_hash = None
    foto_url = None
    if asset_name:
        asset_path = ASSET_DIR / asset_name
        if asset_path.is_file():
            try:
                img_hash = compute_hash(str(asset_path))
            except Exception as exc:  # noqa: BLE001
                print(f"[warn] no se pudo hashear {asset_name}: {exc}")
                img_hash = None
            # Copiamos el asset a media/uploads para que foto_url funcione
            try:
                from app.core import get_settings

                upload_dir = Path(get_settings().upload_dir)
                upload_dir.mkdir(parents=True, exist_ok=True)
                dest = upload_dir / asset_name
                if not dest.exists():
                    dest.write_bytes(asset_path.read_bytes())
                foto_url = f"/media/{asset_name}"
            except Exception as exc:  # noqa: BLE001
                print(f"[warn] no se pudo copiar {asset_name}: {exc}")
                foto_url = None
    today = date.today().isoformat()
    new_row = {
        "id": (max((m["id"] for m in mascotas), default=0)) + 1,
        "usuario_id": owner_id,
        "image_hash": img_hash,
        "fecha": today,
        "created_at": today,
        "foto_url": foto_url,
        **data,
    }
    mascotas.append(new_row)
    return new_row


def run() -> None:
    users = get_table("usuarios")
    for spec in SEED_USERS:
        _upsert_user(users, spec)

    mascotas = get_table("mascotas")
    demo_id = next(u["id"] for u in get_table("usuarios") if u["email"] == SEED_USERS[0]["email"])
    today = date.today().isoformat()

    # Demo originales (todos pertecen al usuario demo, como antes)
    added = 0
    for data in SEED_MASCOTAS:
        if any(m.get("nombre") == data["nombre"] and m.get("usuario_id") == demo_id for m in mascotas):
            continue
        mascotas.append(
            {
                "id": (max((m["id"] for m in mascotas), default=0)) + 1,
                "usuario_id": demo_id,
                "image_hash": None,
                "fecha": today,
                "created_at": today,
                **data,
            }
        )
        added += 1
    if added:
        set_table("mascotas", mascotas)
        print(f"[OK] {added} mascotas demo agregadas")

    # Par A: perceptual. Cruza maria (perdida) y juan (encontrada).
    maria_id = next(u["id"] for u in get_table("usuarios") if u["email"] == SEED_USERS[1]["email"])
    juan_id = next(u["id"] for u in get_table("usuarios") if u["email"] == SEED_USERS[2]["email"])

    for spec in SEED_MATCH_PHOTO:
        owner_id = maria_id if spec["owner_email"] == SEED_USERS[1]["email"] else juan_id
        result = _add_mascota(mascotas, owner_id, {k: v for k, v in spec.items() if k != "owner_email"})
        if result is not None:
            set_table("mascotas", mascotas)
            print(
                f"[OK] Match IA foto: {result['nombre']} ({spec['tipo']}, "
                f"hash={'si' if result['image_hash'] else 'no'})"
            )

    # Par B: metadatos. Mismo cruce maria/juan.
    for spec in SEED_MATCH_META:
        owner_id = maria_id if spec["owner_email"] == SEED_USERS[1]["email"] else juan_id
        result = _add_mascota(mascotas, owner_id, {k: v for k, v in spec.items() if k != "owner_email"})
        if result is not None:
            set_table("mascotas", mascotas)
            print(f"[OK] Match IA meta: {result['nombre']} ({spec['tipo']}, sin foto)")


if __name__ == "__main__":
    run()
