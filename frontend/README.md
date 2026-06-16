# Sanos y Salvos — Frontend (React)

## Setup local

```bash
cd frontend
npm install
cp .env.example .env  # opcional
npm start              # http://localhost:3000
```

Si el backend corre en otra URL, edita `.env`:

```
REACT_APP_API_URL=http://localhost:8000
```

## Estructura

```
src/
├── App.jsx              ← Router + AuthProvider + rutas
├── index.js             ← Entry point con BrowserRouter
├── context/
│   └── AuthContext.js   ← Sesión, login, register, logout
├── services/
│   └── api.js           ← Axios con interceptor JWT
├── hooks/
│   └── useFetch.js      ← Hook genérico de fetch
├── components/
│   ├── Layout.jsx       ← Sidebar + header
│   ├── Sidebar.jsx      ← Navegación
│   ├── PetCard.jsx      ← Tarjeta de mascota
│   ├── Spinner.jsx
│   └── ErrorMessage.jsx
└── pages/
    ├── LoginPage.jsx
    ├── RegisterPage.jsx
    ├── DashboardPage.jsx
    ├── MapaPage.jsx       ← Leaflet + OpenStreetMap
    ├── MascotasPage.jsx
    ├── MascotaDetallePage.jsx
    ├── ReportarPage.jsx   ← Upload con preview
    ├── AlertasPage.jsx
    └── IaPage.jsx
```

## Scripts

```bash
npm start           # dev server
npm run build       # build de producción (build/)
npm run lint        # ESLint
npm run lint:fix    # ESLint con autofix
npm run format      # Prettier --write
npm run format:check
```

## Mapa (Leaflet + OSM)

Usamos [Leaflet](https://leafletjs.com/) con tiles de OpenStreetMap
(gratis, sin API key). Las mascotas con `lat` y `lng` se muestran
como marcadores clicables.

## Despliegue

Build de producción genera `build/` con estáticos listos para Vercel.
Configura `REACT_APP_API_URL` apuntando al backend desplegado.
