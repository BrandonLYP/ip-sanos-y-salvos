# Despliegue Sanos y Salvos MVP

Arquitectura final:
- **Frontend** → Vercel (build estático de Create React App).
- **Backend** → Render (Python + Gunicorn + disco persistente).

## 1. Backend en Render (free tier, sin disco persistente)

> **Estado actual: Plan B activo.** Render no soporta disco persistente
> en el plan free (`disks are not supported for free tier services`).
> `render.yaml` está configurado con rutas relativas. **Los datos y
> fotos se borran en cada redeploy o cuando Render reinicia el
> contenedor.** Es suficiente para una demo del MVP, no para
> operación real con datos persistentes.

### 1.1. Preparación ya incluida en el repo
- `backend/Procfile`: comando de arranque con Gunicorn + UvicornWorker.
- `backend/runtime.txt`: fija Python 3.11.9.
- `backend/requirements.txt`: incluye `gunicorn`.
- `render.yaml`: IaC con la definición completa del servicio (sin disco).
- `backend/app/core/storage.py`: resuelve la ruta de la BD desde la env var `DATABASE_URL`. Formato `json://<ruta>`.
- `backend/app/core/__init__.py`: añade `PORT` a la configuración.

### 1.2. Pasos en Render

1. Entra a <https://dashboard.render.com> y conecta tu cuenta de GitHub.
2. Click **New + → Blueprint**.
3. Apunta al repo `BrandonLYP/ip-sanos-y-salvos`, branch `main`.
4. Render detecta `render.yaml` automáticamente y propone crear:
   - Servicio web: `sanos-y-salvos-api` (free, sin disco)
5. Aplica. Render hace el primer deploy (~3 min).
6. Cuando termine, copia la URL pública (ej. `https://sanos-y-salvos-api.onrender.com`).

### 1.3. Variables de entorno (ya están en render.yaml)
- `DATABASE_URL=json://data/db.json` → BD en el contenedor (efímero).
- `UPLOAD_DIR=media/uploads` → fotos en el contenedor (efímero).
- `SECRET_KEY` → generado por Render (sí persiste en env vars).
- `ALLOWED_ORIGINS=https://sanos-y-salvos.vercel.app` → ajusta cuando tengas la URL real de Vercel.

### 1.4. Sobre la persistencia
- Free tier duerme el servicio tras 15 min sin tráfico, **no borra datos** al despertar.
- Sí se borran en un **redeploy** (manual o automático al hacer push a `main`).
- Para persistencia real, opciones:
  - Plan Starter de Render ($7/mes) con disco persistente.
  - Railway.app ($5 gratis al mes, disco incluido).
  - Migrar storage a Postgres (gratis en Render por 90 días) y uploads a S3/Cloudinary.

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
| Render | Free (sin disco persistente) | $0 — el servicio duerme tras 15 min sin tráfico; los datos son efímeros |
| **Total** | | **$0** |

Si necesitas persistencia real para producción, sube a Render Starter ($7/mes) con disco, o migramos a Railway ($5 gratis/mes con disco incluido).

---

## 5. Smoke test post-deploy

1. Abrir `https://sanos-y-salvos.vercel.app`.
2. Login con `demo@sanosysalvos.cl` / `demo1234` (si la BD se inicializó con `seed.py` — ver abajo).
3. Reportar una mascota con foto.
4. Verificar que la foto aparece en el detalle y en el mapa.
5. Marcar como recuperada.
6. Refrescar: los datos deben seguir ahí (mientras no haya redeploy).

### 5.1. Sembrar datos iniciales
En el dashboard de Render → tu servicio → **Shell** (o `render shell` desde CLI), corre:
```bash
python -c "from app.core.storage import write_all; write_all({'usuarios': [], 'mascotas': [], 'avistamientos': []})"
```
Después, si tienes un script `seed.py` con datos demo, ejecútalo. La BD efímera arranca vacía en cada primer deploy.
