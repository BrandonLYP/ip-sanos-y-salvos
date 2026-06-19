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
- **Python 3.11.9** (pinned en `backend/runtime.txt`)
- **FastAPI** `>=0.115` — API REST + Swagger UI en `/docs`
- **Uvicorn** `>=0.30` para desarrollo
- **Gunicorn** `>=22` con `uvicorn.workers.UvicornWorker` para producción
- **Pydantic v2** `>=2.7` para validación de payloads y settings
- **python-multipart** `>=0.0.12` para uploads `multipart/form-data`
- **Pillow** `>=10` + **imagehash** `>=4.3` para hashing perceptual
  (`average_hash` 8x8, distancia de Hamming → similitud 0-100)
- **Persistencia en JSON plano** (`backend/data/db.json`), con lock por
  thread; ruta configurable vía env `DATABASE_URL=json://<ruta>`
- **Tokens JWT firmados con HMAC-SHA256** (header.payload.signature en
  base64url) generados manualmente, sin librerías externas
- **Hashing de contraseñas** pbkdf2 (sin dependencias externas)

### Frontend
- **React 18.2** + **React Router 6.26** (SPA)
- **Axios 1.7** con interceptor JWT y auto-redirect en 401
- **Tailwind CSS** (vía CDN en `public/index.html` para iteración rápida)
- **Bootstrap Icons 1.13** (paquete npm, no CDN)
- **Leaflet 1.9** + **React-Leaflet 4.2** + tiles de OpenStreetMap
  (sin API key)
- **Recharts 2.8** para gráficos del dashboard (BarChart + PieChart)
- **Create React App 5.0.1** como toolchain de build

### Infra y deploy
- **Vercel** para el frontend (build estático de CRA + SPA rewrites)
- **Render** para el backend (Blueprint desde `render.yaml`, free tier
  con Gunicorn, sin disco persistente — los datos y fotos son
  efímeros; sobreviven sleep/wake pero no redeploys)
- **Sin servicios pagos**. Sin bases de datos gestionadas. Sin keys
  de mapas. Sin CDN de pago.

---

## 2. Estructura del repositorio

```
ip-sanos-y-salvos/
├── backend/                                API FastAPI
│   ├── app/
│   │   ├── main.py                         entrypoint, CORS, /media static, /health
│   │   ├── core/
│   │   │   ├── __init__.py                 Settings (env vars)
│   │   │   ├── security.py                 pbkdf2 + JWT HMAC
│   │   │   ├── storage.py                  JSON DB con lock por thread
│   │   │   └── deps.py                     get_current_user (OAuth2 bearer)
│   │   ├── routes/
│   │   │   ├── auth.py                     /auth/register, /auth/login
│   │   │   ├── mascotas.py                 CRUD + /mascotas/matches
│   │   │   ├── avistamientos.py            avistamientos por mascota
│   │   │   ├── uploads.py                  POST /uploads/ (multipart)
│   │   │   └── stats.py                    /stats/{mensual,especies,resumen}
│   │   ├── schemas/                        Pydantic (auth, mascota, avistamiento)
│   │   └── ia/
│   │       └── matching.py                 imagehash + similitud
│   ├── Procfile                            arranque gunicorn (Render)
│   ├── runtime.txt                         pin Python 3.11.9
│   ├── requirements.txt                    dependencias del backend
│   ├── seed.py                             datos demo (idempotente, auto-corre en
│   │                                       primer arranque si la BD está vacía)
│   ├── generate_seed_images.py             genera las 4 imagenes sinteticas de
│   │                                       seed_assets/ con Pillow
│   ├── seed_assets/                        4 JPGs de prueba para el matching IA
│   │   ├── a1.jpg, a2.jpg                  par perceptual (Toby)
│   │   └── b1.jpg, b2.jpg                  (reservados)
│   └── .env.example                        documenta DATABASE_URL, SECRET_KEY,
│                                           ALLOWED_ORIGINS, UPLOAD_DIR, etc.
├── frontend/                               SPA React
│   ├── public/
│   │   ├── index.html                      incluye Tailwind CDN y favicon
│   │   └── favicon.jpeg                    favicon servido por CRA
│   ├── src/
│   │   ├── App.jsx                         router + AuthProvider + PrivateRoute
│   │   ├── index.js                        BrowserRouter + bootstrap-icons.css
│   │   ├── context/AuthContext.js          login/register/logout, persiste user
│   │   ├── services/api.js                 axios + interceptor JWT
│   │   ├── hooks/
│   │   │   ├── useFetch.js                 carga + loading + error + reload
│   │   │   └── useUnreadAlerts.js          polling + localStorage del badge
│   │   ├── components/
│   │   │   ├── Icon.jsx                    wrapper <i class="bi bi-...">
│   │   │   ├── Logo.jsx                    brand mark
│   │   │   ├── Layout.jsx                  sidebar + header dinamico
│   │   │   ├── Sidebar.jsx                 nav con badge de alertas no leidas
│   │   │   ├── PetCard.jsx                 card de mascota en listas
│   │   │   ├── LocationPicker.jsx          mini-mapa Leaflet para reportar ubicacion
│   │   │   ├── Spinner.jsx, ErrorMessage.jsx
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx, RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx           KPIs + bar/pie charts
│   │   │   ├── MascotasPage.jsx            listado + busqueda + filtros
│   │   │   ├── MascotaDetallePage.jsx      detalle + avistamientos + lightbox
│   │   │   ├── ReportarPage.jsx            formulario de reporte con mapa
│   │   │   ├── MapaPage.jsx                mapa general con pins
│   │   │   ├── AlertasPage.jsx             feed de alertas con badge
│   │   │   └── IaPage.jsx                  vista de matches IA
│   │   └── assets/favicon.jpeg             logo / favicon importado via webpack
│   ├── package.json
│   ├── .eslintrc.json, .prettierrc
│   └── .env.example                        REACT_APP_API_URL
├── render.yaml                             IaC del servicio en Render
├── vercel.json                             build + rewrites SPA
├── DEPLOY.md                               paso a paso de deploy
├── AGENTS.md                               contexto y reglas operativas para el agente
└── README.md                               este archivo
```

---

## 3. Instalación local

### 3.1. Requisitos
- Python 3.11.9 (recomendado el de `backend/runtime.txt`)
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
# Si PowerShell bloquea la activacion:
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
# backend/.env (opcional en dev, los defaults funcionan)
SECRET_KEY=dev-secret-change-me-in-prod
DATABASE_URL=json://data/db.json
UPLOAD_DIR=media/uploads
ALLOWED_ORIGINS=*
MAX_UPLOAD_MB=5
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

```bash
# frontend/.env (opcional en dev)
REACT_APP_API_URL=http://localhost:8000
```

### 3.6. Arrancar en desarrollo

En dos terminales separadas:

```powershell
# Terminal 1: backend (usa el python del venv, no el del sistema)
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
`seed.py` automáticamente: crea 3 usuarios demo y 8-9 mascotas
(5 demo originales + 4 nuevas para probar el matching IA). Si
quieres reiniciar la BD, basta con borrar `backend/data/db.json`
y reiniciar el server.

### 3.7. Credenciales demo (3 cuentas)

| Email | Password | Rol |
|---|---|---|
| `demo@sanosysalvos.cl`  | `demo1234`  | dueño de las 5 mascotas demo originales |
| `maria@sanosysalvos.cl` | `maria1234` | dueño de Toby (perdida) y Mishi (perdida) |
| `juan@sanosysalvos.cl`  | `juan1234`  | dueño de Toby (encontrada) y Mishi (encontrada) |

---

## 4. Endpoints principales

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/auth/register` | — | Crear cuenta (devuelve token + user) |
| `POST` | `/auth/login` | — | Login (devuelve token JWT + user) |
| `GET` | `/mascotas/` | — | Listar mascotas (filtros `tipo`, `estado`, `search`, `limit`) |
| `POST` | `/mascotas/` | ✓ Bearer | Crear reporte |
| `GET` | `/mascotas/{id}` | — | Detalle |
| `PATCH` | `/mascotas/{id}/estado` | ✓ Bearer (solo dueño) | Marcar activa / recuperada / cerrada |
| `GET` | `/mascotas/matches` | — | Coincidencias IA (perdida vs encontrada) |
| `GET` | `/mascotas/{id}/avistamientos/` | — | Listar avistamientos |
| `POST` | `/mascotas/{id}/avistamientos/` | ✓ Bearer | Reportar avistamiento |
| `POST` | `/uploads/` | — | Subir imagen (multipart) — devuelve `{filename, url}` |
| `GET` | `/stats/mensual` | — | Actividad últimos 6 meses |
| `GET` | `/stats/especies` | — | Distribución % por especie (Perro/Gato/Otro) |
| `GET` | `/stats/resumen` | — | KPIs: total, activas, recuperadas, tasa |
| `GET` | `/health` | — | Health check (no debe tocar disco ni BD — ver DEPLOY.md) |
| `GET` | `/` | — | Mensaje + link a /docs |
| `GET` | `/docs` | — | Swagger UI interactivo |

Nota: el AuthContext del frontend llama a `GET /auth/me` para
rehidratar la sesión al recargar, pero **ese endpoint no está
implementado todavía en el backend**. La app sigue funcionando
porque la sesión se rehidrata desde `localStorage` y se reemplaza
en cada login; el fetch silencioso simplemente falla y se ignora.

---

## 5. Modelo de datos (JSON)

`backend/data/db.json` es un único archivo con tres listas. La ruta
se controla con `DATABASE_URL` (formato `json://<ruta>`). Default:
`data/db.json` relativo al cwd.

```json
{
  "usuarios": [
    { "id", "nombre", "email", "password_hash",
      "telefono", "rol", "activo", "created_at" }
  ],
  "mascotas": [
    { "id", "usuario_id", "tipo", "nombre", "especie", "raza",
      "color", "sexo", "edad", "zona", "lat", "lng",
      "descripcion", "contacto", "foto_url",
      "image_hash", "estado", "fecha", "created_at" }
  ],
  "avistamientos": [
    { "id", "mascota_id", "usuario_id", "nota", "foto_url",
      "lat", "lng", "created_at" }
  ]
}
```

Estados posibles de mascota: `activa`, `recuperada`, `cerrada`.

---

## 6. Despliegue

Ver [`DEPLOY.md`](DEPLOY.md) para el paso a paso. Resumen:

- **Frontend** → Vercel, Root Directory `frontend`, build `npm run build`.
- **Backend** → Render (Blueprint desde `render.yaml`), free tier sin
  disco persistente. Los datos y fotos son **efímeros** (sobreviven
  sleep/wake pero no redeploys).
- **CORS** en backend configurado vía env var `ALLOWED_ORIGINS`.

URLs de referencia (las reales están en el dashboard de cada
plataforma):
- API: `https://<tu-subdominio>.onrender.com`
- UI: `https://<tu-app>.vercel.app`

---

## 7. Flujo de contribución

1. Crear rama desde `main`:
   ```bash
   git checkout main
   git pull
   git checkout -b <tipo>/<slug-de-tu-cambio>
   ```
   donde `<tipo>` es `feat/`, `fix/`, `chore/`, `docs/` o `refactor/`.

2. Commits chicos en inglés, mensajes con prefijo (`feat:`,
   `fix:`, `chore:`, `docs:`, `refactor:`).

3. Push y abrir Pull Request hacia `main`.

4. **Brandon revisa y aprueba cada PR** antes de mergear a `main`.
   No se hace merge unilateral, ni siquiera con `--no-ff`.

5. Una vez mergeada, la rama **se conserva** en el repo como
   historial del trabajo realizado. No se borra.

Convenciones:
- Frontend: `npm run lint` + `npm run format` antes de commitear.
- Backend: mantener imports ordenados y evitar `print` en rutas
  (usar `logging` si hace falta; hoy hay algunos `print` legacy
  en el seed que están OK).
- Mensajes en inglés, sin emojis.
- No instalar dependencias nuevas sin discutirlo antes.

---

## 8. Licencia y créditos

Proyecto académico, Duoc UC, 2026. Autor: Brandon
(github.com/BrandonLYP). Tercero no responsable del uso que se le
dé a la información publicada en la plataforma.
