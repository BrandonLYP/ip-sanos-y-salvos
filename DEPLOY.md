# Despliegue Sanos y Salvos MVP

Arquitectura final:
- **Frontend** → Vercel (build estático de Create React App).
- **Backend** → Render (Python + Gunicorn + disco persistente).

## 1. Backend en Render (free tier con disco persistente)

### 1.1. Preparación ya incluida en el repo
- `backend/Procfile`: comando de arranque con Gunicorn + UvicornWorker.
- `backend/runtime.txt`: fija Python 3.11.9.
- `backend/requirements.txt`: incluye `gunicorn`.
- `render.yaml`: IaC con la definición completa del servicio.
- `backend/app/core/storage.py`: ahora resuelve la ruta de la BD desde la env var `DATABASE_URL`. Formato `json://<ruta>`.
- `backend/app/core/__init__.py`: añade `PORT` a la configuración.

### 1.2. Pasos en Render

1. Entra a <https://dashboard.render.com> y conecta tu cuenta de GitHub.
2. Click **New + → Blueprint**.
3. Apunta al repo `BrandonLYP/ip-sanos-y-salvos`.
4. Render detecta `render.yaml` automáticamente y propone crear:
   - Servicio web: `sanos-y-salvos-api`
   - Disco persistente: `sanos-y-salvos-data` (1 GB en `/var/data`)
5. Aplica. Render hace el primer deploy (~3 min).
6. Cuando termine, copia la URL pública (ej. `https://sanos-y-salvos-api.onrender.com`).

### 1.3. Variables de entorno (ya están en render.yaml)
- `DATABASE_URL=json:///var/data/db.json` → BD en el disco persistente.
- `UPLOAD_DIR=/var/data/uploads` → fotos en el disco persistente.
- `SECRET_KEY` → generado por Render.
- `ALLOWED_ORIGINS=https://sanos-y-salvos.vercel.app` → ajusta cuando tengas la URL real de Vercel.

### 1.4. Si el disco persistente no está disponible en tu plan
Cae al **Plan B**: borra la sección `disk:` de `render.yaml` y cambia las env vars a rutas relativas:
- `DATABASE_URL=json://data/db.json`
- `UPLOAD_DIR=media/uploads`
La app sigue funcionando, pero **los datos y fotos se borran en cada redeploy** (free tier duerme el servicio tras 15 min de inactividad, eso no borra datos; los borra un redeploy manual o un cambio de plan).

### 1.5. Verificar
```bash
curl https://sanos-y-salvos-api.onrender.com/health
# {"status":"ok"}
```

---

## 2. Frontend en Vercel

### 2.1. Preparación ya incluida
- `vercel.json`: build command + SPA rewrites (todas las rutas → `index.html`).
- `frontend/.env.example`: documenta `REACT_APP_API_URL`.

### 2.2. Pasos en Vercel

1. Entra a <https://vercel.com/new>.
2. Importa el repo `BrandonLYP/ip-sanos-y-salvos`.
3. Configura:
   - **Framework Preset:** Create React App (o déjalo en auto-detección).
   - **Root Directory:** `frontend`.
   - **Build Command:** `npm run build` (default).
   - **Output Directory:** `build` (default).
4. **Environment Variables** (importante):
   - `REACT_APP_API_URL` = `https://sanos-y-salvos-api.onrender.com`
     (ajusta al subdominio real que Render te haya asignado).
5. Click **Deploy**. Vercel hace el build y publica en `https://sanos-y-salvos.vercel.app` (o el subdominio que elijas).

### 2.3. Ajustar CORS en backend
Una vez tengas la URL de Vercel definitiva, edita `render.yaml`:
```yaml
- key: ALLOWED_ORIGINS
  value: https://tu-subdominio-real.vercel.app
```
Y haz push. Render redepleará automáticamente.

---

## 3. Flujo de desarrollo

1. Creas rama `feat/...` desde `develop`.
2. Pusheas, abres PR.
3. Vercel genera un **Preview Deployment** por cada PR (URL temporal).
4. Render solo redespliega la rama `main` (o la que configures).
5. Cuando mergeas a `develop` o `main`, se actualiza el deploy productivo.

---

## 4. Costos

| Servicio | Plan | Costo |
|---|---|---|
| Vercel | Free (Hobby) | $0 — 100 GB bandwidth, builds ilimitados |
| Render | Free + disco persistente (beta) | $0 — el disco persistente en free está en beta; si no funciona, plan B sin disco |
| **Total** | | **$0** |

Si Render te cobra por el disco persistente (cuando salga de beta), avísame y migramos a Railway o a Postgres/Cloudinary.

---

## 5. Smoke test post-deploy

1. Abrir `https://sanos-y-salvos.vercel.app`.
2. Login con `demo@sanosysalvos.cl` / `demo1234`.
3. Reportar una mascota con foto.
4. Verificar que la foto aparece en el detalle y en el mapa.
5. Marcar como recuperada.
6. Verificar que el cambio persiste tras refrescar (si está en el disco persistente).
