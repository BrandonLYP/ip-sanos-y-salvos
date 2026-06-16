# AGENTS.md — Contexto de sesión para Sanos y Salvos MVP

> **Lee esto primero** antes de tocar cualquier cosa. Resume el proyecto, decisiones tomadas, estado actual y siguientes pasos para que una sesión nueva pueda continuar sin perder contexto.

---

## 1. El proyecto

**Sanos y Salvos** — plataforma chilena de recuperación de mascotas extraviadas. MVP académico para la asignatura *GPY1101 — Evaluación de Proyectos de Software* (Duoc UC).

- **Dueño del repo:** Brandon (https://github.com/BrandonLYP/ip-sanos-y-salvos)
- **Stack acordado:** FastAPI (Python) + React 18, **persistencia JSON** (no SQLAlchemy), **tokens firmados HMAC caseros** (no JWT lib externa), **IA = imagehash** perceptual, **mapa = Leaflet + OpenStreetMap** (sin API key), **deploy = Vercel** (frontend) + host con disco persistente para backend.
- **Documento académico:** `sanosysalvos.md` (en la raíz del repo) contiene el análisis completo de la organización, FODA, MoSCoW, arquitectura propuesta, riesgos y costos.
- **Documento clave de la arquitectura:** sección 4 de `sanosysalvos.md` (capas: Presentación → Lógica de Negocio → Datos → Infraestructura → Integración).

---

## 2. Estructura de ramas Git (CRÍTICO)

```
main                              ← protegido, sólo versiones estables
develop                           ← integración
feat/fase-1-backend-auth-bd       ← MERGEADA a develop
feat/fase-2-uploads-ia            ← ACTUAL (aquí estás, sin mergear aún)
feat/fase-3-deploy-vercel         ← SIGUIENTE
```

**Reglas de trabajo:**

- **Siempre** trabajar en `feat/fase-N-*`. NUNCA commitear directo a `main` o `develop`.
- Cada fase va en su propia rama y se mergea a `develop` con `git merge --no-ff feat/fase-N-*`.
- Commits en inglés, mensajes descriptivos con prefijo (`feat:`, `fix:`, `chore:`, `docs:`).
- **El path del repo en disco:** `D:\DUOC\EVALUACION DE PROYECTOS DE SOFTWARE\3ERA UNIDAD\Sanos y salvos MVP\SanosYSalvos_fullstack\ip-sanos-y-salvos\`
- **Hay una carpeta hermana llamada `sanosproject\`** que es la versión **vieja** anterior al repo. NO trabajar ahí. Siempre `Set-Location` al path de `ip-sanos-y-salvos` antes de cualquier git/server.

---

## 3. Estado actual del proyecto (Fase 1 + 2 implementadas)

### Backend (`backend/`)

Estructura final:

```
backend/
├── app/
│   ├── main.py                ← FastAPI entry, CORS, /uploads static, /health
│   ├── core/
│   │   ├── __init__.py        ← Settings (lee env vars sin pydantic_settings)
│   │   ├── security.py        ← hash_password (pbkdf2), create/decode_access_token (HMAC)
│   │   ├── deps.py            ← get_current_user (OAuth2PasswordBearer)
│   │   └── storage.py         ← read_all/write_all JSON en data/db.json (thread-safe)
│   ├── routes/
│   │   ├── auth.py            ← POST /auth/register, /auth/login (sin /me aún)
│   │   ├── mascotas.py        ← GET/POST/PATCH /mascotas/, /mascotas/{id}, /mascotas/matches
│   │   ├── avistamientos.py   ← GET/POST /mascotas/{id}/avistamientos/
│   │   ├── uploads.py         ← POST /uploads/ (multipart → media/uploads/)
│   │   └── stats.py           ← GET /stats/{mensual,especies,resumen} (calculado real)
│   ├── schemas/               ← Pydantic: auth.py, mascota.py, avistamiento.py
│   └── ia/matching.py         ← compute_hash (imagehash), similarity (0-100)
├── seed.py                    ← crea usuario demo + 5 mascotas de muestra
├── requirements.txt           ← fastapi, uvicorn, pydantic, python-multipart, Pillow, imagehash
├── data/db.json               ← (generado, ignorado por git) BD JSON
├── media/uploads/             ← (generado, ignorado) fotos
└── .env.example               ← DATABASE_URL, SECRET_KEY, ALLOWED_ORIGINS, UPLOAD_DIR
```

**Endpoints verificados funcionando (todos en `http://127.0.0.1:8000/docs`):**

| Método | Ruta | Auth |
|---|---|---|
| POST | `/auth/register` | — |
| POST | `/auth/login` | — |
| GET | `/mascotas/` | — |
| GET | `/mascotas/matches` | — |
| GET | `/mascotas/{id}` | — |
| POST | `/mascotas/` | ✓ Bearer |
| PATCH | `/mascotas/{id}/estado` | ✓ Bearer |
| GET | `/mascotas/{id}/avistamientos/` | — |
| POST | `/mascotas/{id}/avistamientos/` | ✓ Bearer |
| POST | `/uploads/` | — |
| GET | `/stats/{mensual,especies,resumen}` | — |
| GET | `/health` | — |

**Credenciales demo:** `demo@sanosysalvos.cl` / `demo1234` (creado por `seed.py`).

**Decisiones técnicas backend:**

- **No se instaló SQLAlchemy ni JWT lib** porque el venv de `sanosproject/` ya tiene `fastapi, pydantic, pillow, imagehash`. El usuario eligió: persistencia JSON + tokens HMAC caseros. Se instaló `python-multipart` adicionalmente.
- **pbkdf2 hash** en vez de bcrypt (sin dependencia extra).
- **HMAC-SHA256** tokens en formato `header.payload.signature` (base64url).
- **`MascotaOut` con campos opcionales** (defaults `None`) porque el seed no setea `foto_url` y eso causaba 500s.
- **`/mascotas/matches`** combina hash perceptual (cuando ambas mascotas tienen `image_hash`) con soft-match por especie/raza/zona/color.

### Frontend (`frontend/`)

```
frontend/
├── public/index.html
├── src/
│   ├── App.jsx                ← Router + AuthProvider + PrivateRoute
│   ├── index.js               ← BrowserRouter wrapper
│   ├── context/AuthContext.js ← login, register, logout, persistencia, /auth/me
│   ├── services/api.js        ← Axios + interceptor JWT + auto-redirect en 401
│   ├── hooks/useFetch.js      ← hook genérico (loading/error/reload)
│   ├── components/
│   │   ├── Layout.jsx         ← Sidebar + header dinámico
│   │   ├── Sidebar.jsx        ← NavLink, logout, links reportar
│   │   ├── PetCard.jsx        ← Tarjeta con foto (fallback emoji)
│   │   ├── Spinner.jsx
│   │   └── ErrorMessage.jsx
│   └── pages/
│       ├── LoginPage.jsx
│       ├── RegisterPage.jsx
│       ├── DashboardPage.jsx  ← KPIs + Recharts
│       ├── MascotasPage.jsx   ← Lista con search/filtros
│       ├── MascotaDetallePage.jsx ← Recuperar + reportar avistamiento + WhatsApp
│       ├── ReportarPage.jsx   ← Upload real con preview (multipart)
│       ├── MapaPage.jsx       ← Leaflet + OSM
│       ├── AlertasPage.jsx    ← Derivadas de /mascotas/ y /mascotas/matches
│       └── IaPage.jsx
├── package.json               ← React 18, axios, react-router-dom 6, leaflet, recharts
├── .eslintrc.json
├── .prettierrc / .prettierignore
└── .env.example               ← REACT_APP_API_URL
```

**Pendiente de verificar (Fase 2 sin probar end-to-end todavía):**
- `npm install` (no ejecutado aún — depende de que el usuario lo corra).
- `npm start` y login.
- Upload de imagen real.
- Mapa con tiles OSM cargando.
- Marcar recuperada y reportar avistamiento desde la UI.

---

## 4. Venv y comandos importantes

**Python venv (en `backend/venv/`, MUDADO en esta sesión — antes vivía en `sanosproject/venv/`):**
```powershell
# Activar:
& "D:\...\ip-sanos-y-salvos\backend\venv\Scripts\Activate.ps1"

# Si bloquea scripts:
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

**Levantar backend (CRÍTICO — usar el python del venv, NO el del sistema):**
```powershell
Set-Location "D:\...\ip-sanos-y-salvos\backend"
& "D:\...\ip-sanos-y-salvos\backend\venv\Scripts\python.exe" -m uvicorn app.main:app --reload --port 8000
```

**`sanosproject/venv/` ya NO se usa.** El venv viejo se puede borrar para liberar espacio
(eliminación segura: `Remove-Item -Recurse "D:\...\sanosproject\venv"`). NO hacerlo hasta confirmar
que el venv nuevo funciona end-to-end (login + upload + mapa).

**Frontend:**
```powershell
cd "D:\...\ip-sanos-y-salvos\frontend"
npm install
npm start
```

**Seed (idempotente, resetea la BD):**
```powershell
& "D:\...\sanosproject\venv\Scripts\python.exe" "D:\...\ip-sanos-y-salvos\backend\seed.py"
```

---

## 5. Roadmap (Fases pendientes)

| # | Estado | Descripción |
|---|---|---|
| 0 | ✅ | Repo + lint/prettier + estructura base |
| 1 | ✅ | Backend: auth + BD JSON + CRUD protegido + uploads + matching |
| 2 | 🔄 | Frontend: router + auth + upload real + Leaflet (commit listo, sin probar) |
| 3 | ⏳ | Deploy a Vercel (frontend) + host con disco para backend (Render/Railway) |
| 4 | ⏳ | QA, polish, documentación final |

**Fase 3 (siguiente) — Deploy a Vercel:**
- Frontend: `vercel.json` con build estático y `REACT_APP_API_URL` apuntando al backend.
- Backend: Render.com (free tier con disco persistente) o Railway.
- Variables de entorno en cada plataforma.
- CORS en backend actualizado con la URL del frontend en producción.

---

## 6. Reglas de operación (LEER ANTES DE ACTUAR)

1. **Siempre `Set-Location` al repo** (`ip-sanos-y-salvos\`) antes de cualquier `git` o server. La carpeta `sanosproject\` es **basura heredada**, no tocarla.
2. **Trabajar en rama `feat/fase-N-*`.** Nunca directo a `develop` o `main`.
3. **No tomar acciones riesgosas sin preguntar.** El usuario ha corregido dos veces acciones que se colgaron (uvicorn en background, `cd` mal hechos). Cuando el flujo implique procesos largos o de larga vida, **preguntar antes de ejecutar**.
4. **El usuario prefiere verificar él mismo** en procesos que pueden colgarse (levantar servers, `npm install`). Dile los comandos exactos y espera su feedback.
5. **Commits chicos y descriptivos.** Un commit por feature, mensaje en inglés con prefijo.
6. **No inventar dependencias.** Si el venv no tiene algo (ej. `sqlalchemy`, `bcrypt`, `python-multipart` al inicio), **preguntar antes de instalar** o buscar alternativa stdlib.
7. **ESLint + Prettier** ya están configurados. Antes de commit, correr `npm run lint` y `npm run format` en el frontend.
8. **No hacer tests automatizados** (decisión del usuario para mantener velocidad MVP).
9. **IA simple si lo complejo estorba** (imagehash en vez de CNN; Leaflet en vez de Google Maps; Leaflet en vez de API pago).
10. **No usar emojis en código, archivos o mensajes de commit** salvo que el usuario lo pida explícitamente. (Los emojis que ya están en seed.py y comentarios académicos del informe están OK; los nuevos no.)

---

## 7. Próximos pasos concretos

**Estado inmediato:** usuario va a:
1. Levantar el backend con el comando de la sección 4.
2. `npm install` + `npm start` en frontend.
3. Probar login, upload, mapa, marcar recuperada, avistamiento.
4. Reportar qué falla.

**Cuando el usuario reporte OK:**
1. `git checkout develop && git merge feat/fase-2-uploads-ia`
2. `git push origin develop`
3. Crear rama `feat/fase-3-deploy-vercel`.
4. Empezar Fase 3 (deploy).

**Cuando reporte algo que falla:**
1. NO seguir adelante.
2. Preguntar el error exacto.
3. Arreglarlo en la misma rama `feat/fase-2-uploads-ia`, commit + push.

---

## 8. Changelog de decisiones tomadas en la sesión anterior

1. **Persistencia = JSON** (no SQLAlchemy) — acordado con el usuario.
2. **Auth = HMAC casero + pbkdf2** (no JWT lib, no bcrypt) — acordado.
3. **Mapa = Leaflet + OSM** (no Google Maps SDK) — acordado.
4. **IA = imagehash** perceptual (no CNN) — acordado.
5. **Deploy = Vercel frontend + host con disco para backend** — acordado.
6. **Sin tests automatizados** — acordado.
7. **ESLint + Prettier** sí — acordado.
8. **Mobile = sólo PWA-ready** (no app nativa en MVP) — acordado.
9. **Ramas por fase + merge a develop** — acordado.
10. **`MascotaOut` con campos opcionales** (defaults None) — fix aplicado en commit `8ec3ae5`.

---

## 9. Archivos críticos que NO se deben romper

- `backend/app/core/security.py` — pbkdf2 + HMAC tokens (cambiarlo invalida todos los tokens existentes).
- `backend/app/core/storage.py` — formato JSON, agregar campos requiere migración manual.
- `frontend/src/context/AuthContext.js` — contrato de login/register.
- `frontend/src/services/api.js` — baseURL e interceptor 401.
- `data/db.json` — NO commitear, está en .gitignore.

---

## 10. Si te quedas atascado

- **Mi CWD no es el repo** → `Set-Location "D:\DUOC\EVALUACION DE PROYECTOS DE SOFTWARE\3ERA UNIDAD\Sanos y salvos MVP\SanosYSalvos_fullstack\ip-sanos-y-salvos"`.
- **El server no arranca** → verificar que estés usando el python del venv de `sanosproject/`, no el del sistema.
- **`ModuleNotFoundError`** → `pip install <paquete>` con el pip del venv, o buscar alternativa stdlib.
- **El usuario dice "se trabó"** → significa que el comando se colgó o tardó demasiado. Preguntar qué comando estaba corriendo y proponer una alternativa más corta o que él verifique.
- **Conflicto de merge** → preferir `git merge --no-ff` y resolver manualmente.

---

**TL;DR:** Estás en la rama `feat/fase-2-uploads-ia` del repo `ip-sanos-y-salvos`. Backend completo y testeado con curl. Frontend escrito, sin probar end-to-end todavía. El usuario está por levantar el server y `npm install`. Espera su feedback antes de mergear o seguir.
