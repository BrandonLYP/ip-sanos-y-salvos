# Vista 4+1 de la arquitectura

Documento de arquitectura de **Sanos y Salvos MVP** siguiendo el
modelo 4+1 de Kruchten (1995). Cubre 4 vistas + 1 escenario que las
ata. Pensado para revisores académicos y para onboarding de
contribuidores.

Los diagramas están escritos en **Mermaid** y se renderizan
directamente en GitHub, VS Code, Obsidian y la mayoría de visores
de Markdown.

---

## Indice

1. [Vista Logica](#1-vista-logica) - modelo de objetos y paquetes
2. [Vista de Procesos](#2-vista-de-procesos) - flujo runtime
3. [Vista Fisica](#3-vista-fisica) - nodos y red
4. [Vista de Escenarios (+1)](#4-vista-de-escenarios-1) - caso de uso que ata todo
5. [Decisiones arquitectonicas](#5-decisiones-arquitectonicas) - ADRs cortos
6. [Limitaciones conocidas](#6-limitaciones-conocidas) - deuda tecnica explicita

---

## 1. Vista Logica

**Proposito:** modelar el dominio (Usuario / Mascota / Avistamiento)
y la estructura de paquetes tanto del backend como del frontend, sin
preocuparse de donde corren.

### 1.1 Modelo de dominio

```mermaid
classDiagram
    class Usuario {
        +int id
        +string nombre
        +string email
        +string password_hash
        +string telefono
        +string rol
        +bool activo
        +datetime created_at
    }

    class Mascota {
        +int id
        +int usuario_id
        +string tipo  // "perdida" | "encontrada"
        +string nombre
        +string especie
        +string raza
        +string color
        +string sexo
        +string edad
        +string zona
        +float lat
        +float lng
        +string descripcion
        +string contacto
        +string foto_url
        +string image_hash
        +string estado  // "activa" | "recuperada" | "cerrada"
        +date fecha
        +datetime created_at
    }

    class Avistamiento {
        +int id
        +int mascota_id
        +int usuario_id
        +string nota
        +string foto_url
        +float lat
        +float lng
        +datetime created_at
    }

    class Match {
        +int id          // id de la mascota perdida
        +int match_id    // id de la mascota encontrada candidata
        +float score     // 0-100
        +string metodo   // "perceptual" | "metadata"
    }

    Usuario "1" --> "*" Mascota : reporta
    Usuario "1" --> "*" Avistamiento : reporta
    Mascota "1" --> "*" Avistamiento : recibe
    Mascota "1" ..> "*" Mascota : Match (perdida vs encontrada)
```

Nota: `Match` no se persiste. Se calcula en runtime cruzando
`Mascota` activas de tipo opuesto (ver `routes/mascotas.py:get_matches`).

### 1.2 Paquetes del backend

```mermaid
flowchart LR
    subgraph API["app/ (FastAPI)"]
        Main[main.py<br/>lifespan, CORS, /media]
    end

    subgraph Routes["app/routes/"]
        Auth[auth.py<br/>register, login]
        Masc[mascotas.py<br/>CRUD, matches]
        Avi[avistamientos.py]
        Up[uploads.py<br/>multipart]
        Stats[stats.py<br/>mensual, especies, resumen]
    end

    subgraph Schemas["app/schemas/ (Pydantic v2)"]
        SA[auth.py]
        SM[mascota.py]
        SAv[avistamiento.py]
    end

    subgraph Core["app/core/"]
        Sec[security.py<br/>pbkdf2 + JWT HMAC]
        Sto[storage.py<br/>JSON + lock]
        Dep[deps.py<br/>get_current_user]
        Set[__init__.py<br/>Settings env]
    end

    subgraph IA["app/ia/"]
        Mat[matching.py<br/>imagehash + similitud]
    end

    Main --> Routes
    Routes --> Schemas
    Routes --> Core
    Routes --> IA
    Auth --> Sec
    Auth --> Sto
    Masc --> Sto
    Masc --> Mat
    Masc --> Dep
    Avi --> Sto
    Stats --> Sto
    Up --> Sto
```

### 1.3 Paquetes del frontend

```mermaid
flowchart TB
    subgraph App["App.jsx"]
        Router[BrowserRouter + Routes]
        Auth[AuthProvider]
        Priv[PrivateRoute]
    end

    subgraph Pages["src/pages/"]
        LP[LoginPage]
        RP[RegisterPage]
        DP[DashboardPage]
        MP[MascotasPage]
        MDP[MascotaDetallePage]
        RPg[ReportarPage]
        MapP[MapaPage]
        AP[AlertasPage]
        IAP[IaPage]
    end

    subgraph Components["src/components/"]
        Layout[Layout + Sidebar]
        PC[PetCard]
        IC[Icon]
        LG[Logo]
        LPc[LocationPicker]
        SP[Spinner]
        EM[ErrorMessage]
    end

    subgraph Hooks["src/hooks/"]
        UF[useFetch]
        UA[useUnreadAlerts]
    end

    subgraph Svc["src/services/ + context/"]
        API[api.js<br/>axios + interceptor]
        AC[AuthContext]
    end

    Router --> Auth
    Router --> Priv
    Priv --> Layout
    Layout --> Pages
    Pages --> Components
    Pages --> Hooks
    Pages --> Svc
    Hooks --> API
    AC --> API
```

---

## 2. Vista de Procesos

**Proposito:** mostrar el flujo runtime de un request HTTP tipico y
los procesos concurrentes que sostienen el servicio. Refleja las
decisiones de Gunicorn workers, polling del badge, y el
hashing perceptual lazy en el endpoint POST.

### 2.1 Request flow: crear mascota con foto

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuario (browser)
    participant FE as React (axios)
    participant Vercel as Vercel CDN
    participant R as Render (Gunicorn + UvicornWorker)
    participant Auth as deps.get_current_user
    participant Routes as routes/mascotas.py
    participant IA as ia/matching.py
    participant Sto as core/storage.py
    participant FS as backend/media/uploads/

    U->>FE: submit ReportarPage
    FE->>FE: handleSubmit()
    FE->>R: POST /uploads/ (multipart)
    R->>FS: write file (uuid + ext)
    R-->>FE: {filename, url: "/media/abc.jpg"}
    FE->>R: POST /mascotas/ + Bearer
    R->>Auth: decode JWT, fetch user
    Auth-->>R: current_user
    R->>Routes: crear(payload, current_user)
    Routes->>FS: read uploaded file
    Routes->>IA: compute_hash(path)
    IA-->>Routes: image_hash string
    Routes->>Sto: read_all("mascotas")
    Sto-->>Routes: rows
    Routes->>Sto: write_all(rows + new)
    Routes-->>FE: 201 MascotaOut
    FE->>FE: navigate("/mascotas")
```

### 2.2 Procesos concurrentes

```mermaid
flowchart LR
    subgraph Render["Render container (1 instancia)"]
        GW[Gunicorn master]
        W1[UvicornWorker 1]
        W2[UvicornWorker 2]
        W3[UvicornWorker 3]
        HC[Health check<br/>cron Render]
    end

    subgraph Browser["Cada sesion del usuario"]
        AX[axios request handlers]
        PL[useUnreadAlerts<br/>setInterval 30s]
        WA[window 'focus' listener]
    end

    GW --> W1
    GW --> W2
    GW --> W3
    HC -.GET /health.-> W1
    PL -.GET /mascotas/?limit=200.-> W1
    WA -.trigger recompute.-> PL
    AX -.cada peticion.-> W1
```

**Notas de proceso:**

- Gunicorn arranca N workers (1 por CPU core en free tier = 1).
- `UvicornWorker` permite async handlers (FastAPI/Starlette).
- El health check de Render corre cada ~30s y se mantiene trivial
  (ver `main.py:GET /health`) para no tocar disco ni BD.
- El polling del badge en el frontend es un **setInterval 30s** que
  se dispara tambien al recibir `window.focus` (cambio de tab del
  browser).
- El **auto-seed** corre en el `lifespan` de FastAPI al primer
  arranque si la BD esta vacia. Es idempotente, no bloquea el
  arranque si falla.

---

## 3. Vista Fisica

**Proposito:** modelar los nodos reales, donde corre cada artefacto
y como se conectan. Refleja el deploy actual en Vercel + Render
free tier.

### 3.1 Topologia de deploy

```mermaid
flowchart TB
    subgraph Cliente["Cliente"]
        B[Browser del usuario]
    end

    subgraph Vercel["Vercel (free tier)"]
        CDN[Edge CDN<br/>static assets]
        SR[Serverless Function<br/>serve SPA build]
    end

    subgraph Render["Render (free tier, sin disco persistente)"]
        GM[Gunicorn master<br/>:PORT]
        UW[UvicornWorker<br/>app.main:app]
        BD[("data/db.json<br/>(ephemeral FS)")]
        MU[("media/uploads/<br/>(ephemeral FS)")]
    end

    subgraph OSM["OpenStreetMap (externo)"]
        T[Tile servers<br/>tile.openstreetmap.org]
    end

    subgraph GH["GitHub"]
        Repo[ip-sanos-y-salvos]
    end

    B -->|HTTPS| CDN
    CDN -->|cache miss| SR
    SR -->|reverse proxy no,<br/>CDN sirve static| CDN

    B -->|HTTPS XHR<br/>Authorization: Bearer| GM
    GM --> UW
    UW -->|read/write| BD
    UW -->|write file| MU
    UW -->|serve /media/*| MU

    B -->|tile request| T
    T -->|raster| B

    GH -->|webhook push| Vercel
    GH -->|webhook push| Render
```

### 3.2 Artefactos

| Artefacto                      | Donde vive                   | Como se construye                         | Persistencia                                              |
| ------------------------------ | ---------------------------- | ----------------------------------------- | --------------------------------------------------------- |
| `frontend/build/` (CRA static) | Vercel CDN                   | `npm run build` en cada push a `main`     | Cache CDN permanente                                      |
| `backend/app/` (codigo)        | Render container             | `pip install -r requirements.txt`         | Imagen inmutable del deploy                               |
| `data/db.json`                 | Render container FS          | Generado por `seed.py` en primer arranque | **Ephemeral**: sobrevive sleep/wake, se borra en redeploy |
| `media/uploads/*.jpg`          | Render container FS          | Generado por `POST /uploads/`             | **Ephemeral**                                             |
| `seed_assets/*.jpg`            | Render container FS (bundle) | Empaquetado con el codigo                 | Persiste con el codigo (read-only en runtime)             |
| `static.json` (Tailwind)       | Vercel CDN                   | Incluido en `public/index.html`           | Cache CDN                                                 |

### 3.3 URLs de referencia

| Servicio | URL (referencia)                  | Lectura                      |
| -------- | --------------------------------- | ---------------------------- |
| UI       | `https://<proyecto>.vercel.app`   | https://vercel.com/dashboard |
| API      | `https://<proyecto>.onrender.com` | https://dashboard.render.com |

---

## 4. Vista de Escenarios (+1)

**Proposito:** anclar las 4 vistas en un caso de uso real que
recorre el sistema entero. Este escenario muestra como las piezas
se conectan cuando un duenio reporta, la IA encuentra un match, y
otro usuario ve la notificacion.

### Escenario: "Dueño reporta mascota, IA encuentra match, comunidad lo ve"

```mermaid
sequenceDiagram
    autonumber
    actor Maria as Maria (duena)
    actor Juan as Juan (vecino)
    participant FE as ReportarPage
    participant LP as LocationPicker
    participant API as FastAPI
    participant Hash as ia/matching.py
    participant DB as data/db.json
    participant Sidebar as Sidebar (badge)
    participant Poll as useUnreadAlerts

    rect rgb(245, 245, 245)
        Note over Maria,API: Logical view - clases Mascota, Usuario<br/>Process view - flujo POST /mascotas/
        Maria->>FE: completa form + click en mapa
        FE->>LP: onClick(mapa)
        LP-->>FE: {lat, lng}
        Maria->>FE: Publicar reporte
        FE->>API: POST /uploads/ (multipart)
        API-->>FE: {url: "/media/abc.jpg"}
        FE->>API: POST /mascotas/ (Bearer)
        API->>Hash: compute_hash(file)
        Hash-->>API: image_hash
        API->>DB: append mascota
    end

    rect rgb(235, 248, 240)
        Note over Juan,API: Physical view - Vercel + Render<br/>Process view - polling 30s
        Juan->>API: POST /mascotas/ (encontrada)
        API->>Hash: compute_hash(juan.jpg)
        API->>DB: append
    end

    rect rgb(255, 247, 230)
        Note over DB,Poll: Logical - relacion Match<br/>Physical - render -> browser
        Juan->>API: GET /mascotas/matches
        API->>DB: read_all
        API->>Hash: similarity(a.hash, b.hash)
        Hash-->>API: 80.0
        API-->>Juan: [{...match: 80.0}]
    end

    rect rgb(240, 248, 255)
        Note over Poll,Sidebar: Process - setInterval + focus<br/>UI - badge en Sidebar
        loop cada 30s o al focus
            Poll->>API: GET /mascotas/?limit=200
            API-->>Poll: [...]
            Poll->>Poll: count > lastSeenId
            Poll-->>Sidebar: setUnread(n)
        end
        Sidebar->>Maria: badge rojo "1"
    end

    rect rgb(252, 240, 245)
        Note over Maria,API: UX - al click se limpia el badge
        Maria->>API: GET /alertas (click en Sidebar)
        Maria->>Maria: markAlertasSeen()
        Maria->>Sidebar: badge = 0
    end
```

**Que vistas se ejercitan en este escenario:**

| Vista           | Lo que demuestra                                                               |
| --------------- | ------------------------------------------------------------------------------ |
| Logica          | Entidades `Usuario`, `Mascota`, relacion `Match`                               |
| Procesos        | 4 requests secuenciales + polling concurrente                                  |
| Fisica          | Vercel sirve el bundle, Render ejecuta Gunicorn, BD ephemeral, OSM sirve tiles |
| Escenarios (+1) | El loop cerrado: crear -> match -> notificar -> leer                           |

---

## 5. Decisiones arquitectonicas

ADRs cortos que justifican las elecciones no obvias.

### ADR-001: Persistencia en JSON, no SQL

- **Contexto:** MVP academico de 2-3 meses. Tabla pequena (~3 entidades), trafico bajo.
- **Decision:** un unico `data/db.json` con lock por thread.
- **Consecuencias:** cero infra externa, deploy trivial, facil de inspeccionar.
- **Trade-off:** no escala, no soporta concurrencia real (lock = serial).
- **Salida:** cuando se justifique, migrar a Postgres sin cambiar la API (ver `routes/mascotas.py` y `core/storage.py` como unica fuente de acceso a datos).

### ADR-002: JWT firmado a mano, sin libreria externa

- **Contexto:** se necesita autenticacion stateless pero la libreria `pyjwt` agrega una dependencia.
- **Decision:** implementar `create_access_token` / `verify_token` con `hmac` + `hashlib` stdlib en `core/security.py`.
- **Consecuencias:** zero deps extra, control total del formato. Mismo formato que un JWT real (header.payload.signature base64url).
- **Trade-off:** no hay validacion automatica de estandares. No soporta `kid`/JWKS.

### ADR-003: Matching perceptual con `imagehash`, no CNN

- **Contexto:** necesito comparar imagenes para encontrar mascotas perdidas.
- **Decision:** perceptual hash (8x8 average_hash) + distancia de Hamming.
- **Consecuencias:** rapido, sin GPU, sin modelo que mantener. ~0.1 ms por hash.
- **Trade-off:** sensible a cambios fuertes (rotacion, crop agresivo). Documentado en `ia/matching.py`.
- **Salida:** embeddings (CLIP, EfficientNet) cuando se justifique precision.

### ADR-004: Frontend en Vercel, backend en Render

- **Contexto:** deploy economico, sin tarjeta.
- **Decision:** Vercel (static + edge) para SPA, Render free tier (Gunicorn) para FastAPI.
- **Consecuencias:** $0/mes. Sin disco persistente en backend.
- **Trade-off:** los datos y fotos se pierden en redeploy. La app es demo, no produccion real.
- **Salida:** Render Starter ($7/mes) o Railway ($5 gratis) si se necesita persistencia.

### ADR-005: Tokens HMAC y CORS permisivo en dev

- **Contexto:** CORS `allow_origins=["*"]` en dev esta bien, en prod hay que restringir.
- **Decision:** env var `ALLOWED_ORIGINS` leida en `core/__init__.py:cors_origins`. Default `*` (dev). En prod se setea a la URL de Vercel.
- **Consecuencias:** configurar CORS en el dashboard de Render antes de produccion.

---

## 6. Limitaciones conocidas

Deuda tecnica explicita que el README heredo y este documento
formaliza.

| #   | Limitacion                                                                            | Impacto                                                                  | Cuando arreglarla                                    |
| --- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------- |
| 1   | `GET /auth/me` no implementado                                                        | El frontend lo llama pero falla silencioso; localStorage cubre la sesion | Cuando se agregue logout multi-tab o revocar tokens  |
| 2   | Disco efimero en Render                                                               | Datos y fotos se pierden en redeploy                                     | Migrar a Render Starter o Railway                    |
| 3   | CORS `*` por default                                                                  | Si nadie configura `ALLOWED_ORIGINS` en prod, todos los origenes pasan   | Forzar en deploy via `render.yaml`                   |
| 4   | `data/db.json` lock por thread                                                        | Bajo trafico OK, no escala a multiples procesos                          | Migrar a Postgres cuando crezca                      |
| 5   | `imagehash.average_hash` no invariante a rotacion                                     | Match cae drasticamente con fotos rotadas                                | Migrar a `phash` o CNN                               |
| 6   | Health check de Render cada 30s                                                       | Ruido en logs, no es un problema de carga                                | Filtrar en dashboard de Render                       |
| 7   | Tailwind via CDN                                                                      | No se tree-shake, pesa mas que la build local                            | Migrar a PostCSS cuando crezca                       |
| 8   | Sin tests automatizados                                                               | Decidido por el dueno para mantener velocidad del MVP                    | Cuando se estabilice la API                          |
| 9   | Bug pre-existente en seed: mascotas con nombre "Sin nombre" se skipean la segunda vez | El seed no crea todos los demos esperados                                | Refactor a identificadores unicos en lugar de nombre |

---

## Referencias

- Kruchten, P. (1995). "Architectural Blueprints - The 4+1 View Model of Software Architecture". IEEE Software 12(6).
- AGENTS.md - reglas de operacion del proyecto.
- README.md - setup, endpoints, demo accounts.
- DEPLOY.md - paso a paso de deploy en Vercel y Render.
