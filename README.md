# 🐾 Sanos y Salvos — MVP Full Stack

## Estructura
```
SanosYSalvos/
├── backend/          ← FastAPI (Python)
│   ├── app.py
│   ├── routes/
│   │   ├── mascotas.py   (GET, POST, PATCH)
│   │   ├── alertas.py    (GET, POST)
│   │   └── stats.py      (GET /mensual, /especies)
│   ├── ia/
│   │   └── matching.py   (Pillow + imagehash)
│   └── venv/
└── frontend/         ← React
    ├── src/
    │   ├── App.jsx   (fetch desde localhost:8000)
    │   └── index.js
    └── public/
```

## Cómo ejecutar

### 1. Backend (FastAPI)
```bash
cd backend
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux
uvicorn app:app --reload
# Corre en http://localhost:8000
# Docs en  http://localhost:8000/docs
```

### 2. Frontend (React) — en otra terminal
```bash
cd frontend
npm install
npm start
# Abre http://localhost:3000
```

## Endpoints disponibles
| Método | Ruta                    | Descripción              |
|--------|-------------------------|--------------------------|
| GET    | /mascotas/              | Listar (filtros opcionales) |
| GET    | /mascotas/{id}          | Detalle de una mascota   |
| GET    | /mascotas/matches       | Coincidencias IA         |
| POST   | /mascotas/              | Crear reporte            |
| PATCH  | /mascotas/{id}/estado   | Actualizar estado        |
| GET    | /alertas/               | Listar alertas           |
| POST   | /alertas/               | Crear alerta             |
| GET    | /stats/mensual          | Stats por mes            |
| GET    | /stats/especies         | Stats por especie        |
