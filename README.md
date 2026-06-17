# Sanos y Salvos

Plataforma chilena de recuperación de mascotas extraviadas. Permite a
dueños reportar mascotas perdidas, a quien las encuentre publicar
reportes de avistamientos, y a la comunidad cruzarlos con un motor de
coincidencias visual (perceptual hash) y filtros por especie, raza,
zona y color.

MVP académico para la asignatura **GPY1101 — Evaluación de Proyectos
de Software** (Duoc UC).

---

## 1. Stack tecnológico

### Backend
- **Python 3.11** + **FastAPI** 0.115
- **Uvicorn** (desarrollo) + **Gunicorn** con workers Uvicorn (producción)
- **Pydantic v2** para validación de payloads
- **Pillow** + **imagehash** para hashing perceptual de imágenes
- **Persistencia en JSON** plano (`backend/data/db.json`), con lock por thread
- **Tokens firmados HMAC-SHA256** (formato `header.payload.signature` base64url)
- **Hashing de contraseñas** pbkdf2 (sin dependencias externas)

### Frontend
- **React 18** + **React Router 6** (SPA)
- **Axios** con interceptor JWT y auto-redirect en 401
- **Tailwind CSS** (vía CDN en `public/index.html` para iteración rápida)
- **Bootstrap Icons** (`bootstrap-icons` npm)
- **Leaflet 1.9** + tiles de OpenStreetMap (sin API key)
- **Recharts 2.8** para gráficos del dashboard

### Infra y deploy
- **Vercel** para el frontend (build estático de CRA + SPA rewrites)
- **Render** para el backend (free tier, Gunicorn)
- **Sin servicios pagos**. Sin bases de datos gestionadas. Sin keys de mapas.

---

## 2. Estructura del repositorio

```
ip-sanos-y-salvos/
├── backend/                    API FastAPI
│   ├── app/
│   │   ├── main.py             entrypoint, CORS, /uploads static, /health
│   │   ├── core/               config, storage JSON, deps auth, security
│   │   ├── routes/             auth, mascotas, avistamientos, uploads, stats
│   │   ├── schemas/            Pydantic
│   │   └── ia/matching.py      perceptual hash + similitud
│   ├── Procfile                arranque gunicorn (Render)
│   ├── runtime.txt             pin Python 3.11.9
│   ├── requirements.txt
│   ├── seed.py                 datos demo (idempotente, auto-corre en primer arranque)
│   └── .env.example
├── frontend/                   SPA React
│   ├── public/index.html       incluye Tailwind CDN y <link rel=icon>
│   ├── src/
│   │   ├── App.jsx             router + AuthProvider + PrivateRoute
│   │   ├── context/AuthContext.js
│   │   ├── services/api.js     axios + interceptor JWT
│   │   ├── hooks/              useFetch, useUnreadAlerts
│   │   ├── components/         Icon, Logo, Layout, Sidebar, PetCard, LocationPicker...
│   │   ├── pages/              Login, Register, Dashboard, Mascotas, Reportar, Mapa, Alertas, Ia
│   │   └── assets/favicon.jpeg logo / favicon
│   ├── package.json
│   └── .env.example
├── render.yaml                 IaC del servicio en Render
├── vercel.json                 build + rewrites SPA
├── DEPLOY.md                   paso a paso de deploy
├── AGENTS.md                   contexto y reglas operativas para el agente
└── README.md                   este archivo
```

---

## 3. Instalación local

### 3.1. Requisitos
- Python 3.11.x
- Node.js 18.x o 20.x
- Git

### 3.2. Clonar
```bash
git clone https://github.com/BrandonLYP/ip-sanos-y-salvos.git
cd ip-sanos-y-salvos
```

### 3.3. Backend

```powershell
# Crear y activar venv (Windows PowerShell)
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
# Si PowerShell bloquea la activación:
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Instalar dependencias
pip install --upgrade pip
pip install -r requirements.txt
```

```bash
# macOS / Linux
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3.4. Frontend

```bash
cd ../frontend
npm install
```

### 3.5. Variables de entorno

Copiar los `.env.example` a `.env` en cada carpeta y ajustar si hace
falta. Por defecto todo apunta a `http://localhost:8000`.

```bash
# backend/.env (opcional en dev, defaults funcionan)
SECRET_KEY=dev-secret-change-me-in-prod
DATABASE_URL=json://data/db.json
UPLOAD_DIR=media/uploads
ALLOWED_ORIGINS=*
```

```bash
# frontend/.env (opcional en dev, defaults funcionan)
REACT_APP_API_URL=http://localhost:8000
```

### 3.6. Arrancar en desarrollo

En dos terminales separadas:

```powershell
# Terminal 1: backend
cd backend
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
# API:    http://127.0.0.1:8000
# Docs:   http://127.0.0.1:8000/docs
```

```powershell
# Terminal 2: frontend
cd frontend
npm start
# UI:     http://localhost:3000
```

Al primer arranque, el backend detecta la BD vacía y ejecuta
`seed.py` automáticamente: crea el usuario demo y 5 mascotas de
muestra. Si quieres reiniciar la BD, basta con borrar
`backend/data/db.json` y reiniciar el server.

### 3.7. Credenciales demo

```
email:    demo@sanosysalvos.cl
password: demo1234
```

---

## 4. Endpoints principales

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/auth/register` | — | Crear cuenta |
| `POST` | `/auth/login` | — | Login (devuelve token HMAC) |
| `GET` | `/mascotas/` | — | Listar mascotas (filtros `tipo`, `estado`, `search`, `limit`) |
| `POST` | `/mascotas/` | ✓ Bearer | Crear reporte |
| `GET` | `/mascotas/{id}` | — | Detalle |
| `PATCH` | `/mascotas/{id}/estado` | ✓ Bearer | Marcar activa / recuperada / cerrada |
| `GET` | `/mascotas/matches` | — | Coincidencias IA (perdida vs encontrada) |
| `GET` | `/mascotas/{id}/avistamientos/` | — | Listar avistamientos |
| `POST` | `/mascotas/{id}/avistamientos/` | ✓ Bearer | Reportar avistamiento |
| `POST` | `/uploads/` | — | Subir imagen (multipart) |
| `GET` | `/stats/{mensual,especies,resumen}` | — | Métricas agregadas |
| `GET` | `/health` | — | Health check (NO tocar — ver DEPLOY.md) |

Documentación interactiva completa en `/docs` (Swagger UI).

---

## 5. Modelo de datos (JSON)

`backend/data/db.json` es un único archivo con tres listas:

```json
{
  "usuarios":      [ { "id", "nombre", "email", "password_hash", ... } ],
  "mascotas":      [ { "id", "tipo", "nombre", "especie", "raza", "color",
                       "sexo", "edad", "zona", "lat", "lng",
                       "descripcion", "contacto", "foto_url",
                       "image_hash", "estado", "fecha", "created_at" } ],
  "avistamientos": [ { "id", "mascota_id", "usuario_id", "nota", "foto_url",
                       "lat", "lng", "created_at" } ]
}
```

La ruta del archivo se controla con `DATABASE_URL` (formato
`json://<ruta>`). Default: `data/db.json` relativo al cwd.

---

## 6. Despliegue

Ver [`DEPLOY.md`](DEPLOY.md) para el paso a paso. Resumen:

- **Frontend** → Vercel, Root Directory `frontend`, build `npm run build`.
- **Backend** → Render (Blueprint desde `render.yaml`), free tier sin disco
  persistente. Los datos y fotos son **efímeros** (sobreviven sleep/wake
  pero no redeploys).
- **CORS** en backend configurado vía env var `ALLOWED_ORIGINS`.

URLs en producción:
- API: `https://sanos-y-salvos-api.onrender.com`
- UI: `https://sanos-y-salvos.vercel.app`

---

## 7. Flujo de contribución

1. Crear rama desde `main`:
   ```bash
   git checkout main
   git pull
   git checkout -b feat/<slug-de-tu-cambio>
   ```
2. Commits chicos en inglés, mensajes con prefijo (`feat:`, `fix:`,
   `chore:`, `docs:`, `refactor:`).
3. Push y abrir Pull Request hacia `main`.
4. **Brandon revisa y aprueba cada PR** antes de mergear a `main`. No
   se hace merge unilateral, ni siquiera con `--no-ff`.
5. Una vez mergeada, la rama **se conserva** en el repo como historial
   del trabajo realizado. No se borra.

Convenciones:
- Frontend: `npm run lint` + `npm run format` antes de commitear.
- Mensajes en inglés, sin emojis.
- No instalar dependencias nuevas sin discutirlo antes.

---

## 8. Licencia y créditos

Proyecto académico, Duoc UC, 2026. Autor: Brandon (github.com/BrandonLYP).
Tercero no responsable del uso que se le dé a la información publicada
en la plataforma.
