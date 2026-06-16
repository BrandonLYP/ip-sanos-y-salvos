# Sanos y Salvos — Backend (FastAPI)

## Setup local

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate    # Mac/Linux
pip install -r requirements.txt
```

Crear archivo `.env` en la raíz del backend (copia `.env.example`):

```
DATABASE_URL=sqlite:///./sanos.db
SECRET_KEY=alguna-clave-secreta-larga
ALLOWED_ORIGINS=http://localhost:3000
```

Cargar datos de demo:

```bash
python seed.py
```

Levantar el servidor:

```bash
uvicorn app:app --reload
```

- API: http://localhost:8000
- Docs: http://localhost:8000/docs

## Endpoints principales

| Método | Ruta                                      | Auth | Descripción                       |
|--------|-------------------------------------------|------|-----------------------------------|
| POST   | /auth/register                            | -    | Crear cuenta                      |
| POST   | /auth/login                               | -    | Login (retorna JWT)               |
| GET    | /auth/me                                  | ✓    | Usuario actual                    |
| GET    | /mascotas/                                | -    | Listar (filtros: tipo, estado…)   |
| POST   | /mascotas/                                | ✓    | Crear reporte                     |
| GET    | /mascotas/{id}                            | -    | Detalle                           |
| PATCH  | /mascotas/{id}/estado                     | ✓    | Cambiar estado                    |
| GET    | /mascotas/matches                         | -    | Coincidencias IA                  |
| GET    | /mascotas/{id}/avistamientos/             | -    | Listar avistamientos              |
| POST   | /mascotas/{id}/avistamientos/             | ✓    | Reportar avistamiento             |
| POST   | /uploads/                                 | -    | Subir imagen (multipart)          |
| GET    | /stats/mensual                            | -    | Stats últimos 6 meses             |
| GET    | /stats/especies                           | -    | % por especie                     |
| GET    | /stats/resumen                            | -    | KPIs dashboard                    |

## Notas MVP

- **SQLite** por defecto (sin instalar nada extra). Para Postgres basta cambiar
  `DATABASE_URL` a `postgresql://user:pass@host:5432/db`.
- **Sin migraciones Alembic** en MVP: `Base.metadata.create_all` crea las tablas
  en cada arranque. La estructura es estable por ahora.
- **JWT** con expiración 24h.
- **IA**: hash perceptual (`imagehash`) para fotos, soft-match por
  especie+raza+zona+color cuando no hay foto.

## Despliegue

Pensado para **Vercel** (frontend) + cualquier host Python (Render, Railway,
Fly.io) para el backend. La BD en MVP es SQLite embebida, por lo que el
backend debe correr en un host con **disco persistente** (Render free tier
sirve, Vercel serverless no).
