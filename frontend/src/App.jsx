import { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const API = "http://localhost:8000";

// ─── API HELPERS ──────────────────────────────────────────────────────────────
const api = {
  get:  (path)       => fetch(`${API}${path}`).then(r => r.json()),
  post: (path, body) => fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  }).then(r => r.json()),
};

// ─── HOOK GENÉRICO DE FETCH ───────────────────────────────────────────────────
function useFetch(path) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api.get(path)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [path]);

  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load };
}

// ─── MAPA (simula Google Maps SDK) ────────────────────────────────────────────
const MapaMock = ({ pets, onSelectPet }) => {
  const zonas = [
    { nombre: "Providencia", x: 52, y: 55 }, { nombre: "Las Condes",  x: 72, y: 38 },
    { nombre: "Ñuñoa",       x: 58, y: 68 }, { nombre: "Vitacura",    x: 65, y: 28 },
    { nombre: "Stgo Centro", x: 40, y: 62 }, { nombre: "La Reina",    x: 72, y: 55 },
  ];
  const positions = [
    { x: 51, y: 53 }, { x: 73, y: 36 }, { x: 59, y: 66 },
    { x: 53, y: 57 }, { x: 39, y: 63 }, { x: 66, y: 26 },
  ];
  return (
    <div className="relative w-full h-full bg-blue-50 rounded-lg overflow-hidden border border-blue-200">
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <rect width="100" height="100" fill="#EBF5FB" />
        <line x1="0" y1="50" x2="100" y2="50" stroke="#C8DFF0" strokeWidth="1.5" />
        <line x1="50" y1="0" x2="50" y2="100" stroke="#C8DFF0" strokeWidth="1.5" />
        <line x1="0" y1="35" x2="100" y2="60" stroke="#C8DFF0" strokeWidth="0.8" />
        <ellipse cx="45" cy="42" rx="8" ry="5" fill="#C8E6C9" opacity="0.6" />
        <ellipse cx="78" cy="70" rx="6" ry="4" fill="#C8E6C9" opacity="0.6" />
        <path d="M0,40 Q25,38 50,42 Q75,46 100,44" stroke="#90CAF9" strokeWidth="2" fill="none" />
      </svg>
      {zonas.map(z => (
        <div key={z.nombre} className="absolute text-blue-400 font-medium pointer-events-none"
          style={{ left: `${z.x}%`, top: `${z.y}%`, transform: "translate(-50%,-50%)", fontSize: 9 }}>
          {z.nombre}
        </div>
      ))}
      {pets.slice(0, positions.length).map((pet, i) => {
        const pos   = positions[i];
        const color = pet.estado === "recuperada" ? "#4CAF50" : pet.tipo === "perdida" ? "#F44336" : "#FF9800";
        return (
          <button key={pet.id} onClick={() => onSelectPet(pet)}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full text-white text-sm shadow-md border-2 border-white hover:scale-125 transition-transform"
              style={{ background: color }}>
              {pet.foto}
              {pet.match > 70 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border border-white animate-pulse" />
              )}
            </div>
          </button>
        );
      })}
      <div className="absolute bottom-2 left-2 bg-white bg-opacity-90 rounded p-2 text-xs space-y-1">
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Perdida</div>
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500 inline-block" /> Encontrada</div>
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> Recuperada</div>
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse inline-block" /> Match IA</div>
      </div>
      <div className="absolute top-2 right-2 bg-white bg-opacity-80 rounded px-2 py-1 text-xs text-blue-500 font-medium">
        📍 Santiago, Chile · Google Maps SDK
      </div>
    </div>
  );
};

// ─── LOADING / ERROR ──────────────────────────────────────────────────────────
const Spinner = () => (
  <div className="flex items-center justify-center py-12 text-gray-400">
    <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mr-3" />
    Cargando desde FastAPI...
  </div>
);

const ErrorMsg = ({ msg, onRetry }) => (
  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-center gap-3">
    <span>⚠️</span>
    <div className="flex-1">
      <p className="font-bold">No se puede conectar al backend</p>
      <p className="text-xs mt-0.5">{msg} — ¿Está corriendo <code>uvicorn app:app --reload</code>?</p>
    </div>
    <button onClick={onRetry} className="bg-red-100 hover:bg-red-200 px-3 py-1 rounded-lg whitespace-nowrap">Reintentar</button>
  </div>
);

// ─── FORMULARIO REPORTE ───────────────────────────────────────────────────────
const FormReporte = ({ tipo, onClose, onSubmit }) => {
  const [form,    setForm]    = useState({ nombre: "", especie: "Perro", raza: "", color: "", sexo: "Macho", zona: "", descripcion: "", contacto: "" });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setLoading(true);
    const foto = form.especie === "Gato" ? "🐈" : "🐕";
    const ok = await onSubmit({ ...form, tipo, foto });
    setLoading(false);
    if (ok) onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-screen overflow-y-auto">
        <div className="p-5 border-b flex items-center justify-between"
          style={{ background: tipo === "perdida" ? "#F44336" : "#FF9800" }}>
          <h2 className="text-white font-bold text-lg">
            {tipo === "perdida" ? "🔍 Reportar mascota perdida" : "🐾 Reportar mascota encontrada"}
          </h2>
          <button onClick={onClose} className="text-white text-xl font-bold">×</button>
        </div>
        <div className="p-5 space-y-4">
          {tipo === "perdida" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la mascota</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Ej: Luna"
                value={form.nombre} onChange={e => set("nombre", e.target.value)} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Especie</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.especie} onChange={e => set("especie", e.target.value)}>
                <option>Perro</option><option>Gato</option><option>Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.sexo} onChange={e => set("sexo", e.target.value)}>
                <option>Macho</option><option>Hembra</option><option>Desconocido</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Raza</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Ej: Labrador"
                value={form.raza} onChange={e => set("raza", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Ej: Amarillo"
                value={form.color} onChange={e => set("color", e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zona / Comuna</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Ej: Providencia"
              value={form.zona} onChange={e => set("zona", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={3}
              placeholder="Señas particulares, collar, chip..."
              value={form.descripcion} onChange={e => set("descripcion", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contacto (WhatsApp)</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="9 XXXX XXXX"
              value={form.contacto} onChange={e => set("contacto", e.target.value)} />
          </div>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500 text-sm">
            📷 Subir foto (AWS S3) — arrastra o haz clic
          </div>
        </div>
        <div className="p-5 border-t flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 rounded-lg py-2 text-sm text-white font-bold disabled:opacity-60 transition"
            style={{ background: tipo === "perdida" ? "#F44336" : "#FF9800" }}>
            {loading ? "Enviando → POST /mascotas/..." : "Publicar reporte"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── PET CARD ─────────────────────────────────────────────────────────────────
const PetCard = ({ pet, onSelect }) => {
  const badgeColor  = pet.tipo === "perdida"      ? "bg-red-100 text-red-700"     : "bg-orange-100 text-orange-700";
  const estadoColor = pet.estado === "recuperada" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700";
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition cursor-pointer"
      onClick={() => onSelect(pet)}>
      <div className="flex items-start gap-3">
        <div className="text-4xl">{pet.foto}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-gray-800">{pet.nombre}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeColor}`}>
              {pet.tipo === "perdida" ? "Perdida" : "Encontrada"}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoColor}`}>{pet.estado}</span>
            {pet.match > 70 && (
              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-yellow-100 text-yellow-700 animate-pulse">
                🤖 Match {pet.match}%
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">{pet.raza} · {pet.color} · {pet.sexo}</p>
          <p className="text-xs text-gray-400 mt-0.5">📍 {pet.zona} · {pet.fecha}</p>
          <p className="text-xs text-gray-500 mt-1 truncate">{pet.descripcion}</p>
        </div>
      </div>
    </div>
  );
};

// ─── PET MODAL ────────────────────────────────────────────────────────────────
const PetModal = ({ pet, allPets, onClose }) => {
  const matches = allPets.filter(p => p.id !== pet.id && p.tipo !== pet.tipo && p.match > 60);
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-screen overflow-y-auto">
        <div className="p-5 border-b flex items-center justify-between bg-gray-50">
          <h2 className="font-bold text-gray-800 text-lg">GET /mascotas/{pet.id}</h2>
          <button onClick={onClose} className="text-gray-500 text-xl font-bold">×</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="text-6xl">{pet.foto}</div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">{pet.nombre}</h3>
              <p className="text-gray-500">{pet.especie} · {pet.raza}</p>
              <p className="text-gray-500">{pet.color} · {pet.sexo} · {pet.edad}</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
            <p><span className="font-medium">📍 Zona:</span> {pet.zona}</p>
            <p><span className="font-medium">📅 Fecha:</span> {pet.fecha}</p>
            <p><span className="font-medium">📝 Descripción:</span> {pet.descripcion}</p>
            <p><span className="font-medium">📱 Contacto:</span> {pet.contacto}</p>
          </div>
          {matches.length > 0 && (
            <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-3">
              <p className="font-bold text-yellow-800 text-sm mb-2">🤖 Coincidencias — GET /mascotas/matches</p>
              {matches.map(m => (
                <div key={m.id} className="flex items-center gap-2 bg-white rounded p-2 mb-1">
                  <span className="text-2xl">{m.foto}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{m.nombre} · {m.zona}</p>
                    <p className="text-xs text-gray-500">{m.descripcion}</p>
                  </div>
                  <span className="text-sm font-bold text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">{m.match}%</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <button className="flex-1 bg-green-500 text-white rounded-lg py-2 text-sm font-bold hover:bg-green-600">💬 Contactar</button>
            <button className="flex-1 bg-blue-500 text-white rounded-lg py-2 text-sm font-bold hover:bg-blue-600">🔔 Seguir</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
export default function App() {
  const [vista,       setVista]       = useState("dashboard");
  const [pets,        setPets]        = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [showForm,    setShowForm]    = useState(null);
  const [search,      setSearch]      = useState("");
  const [filtro,      setFiltro]      = useState("todas");
  const [newAlert,    setNewAlert]    = useState(null);

  // ── Fetch desde FastAPI ────────────────────────────────────────────────────
  const { data: allPets,  loading: loadPets,   error: errPets,   reload: reloadPets   } = useFetch("/mascotas/");
  const { data: alertas,  loading: loadAlerts, error: errAlerts, reload: reloadAlerts } = useFetch("/alertas/");
  const { data: statsMes, loading: loadStats                                           } = useFetch("/stats/mensual");
  const { data: statsEsp                                                                } = useFetch("/stats/especies");

  useEffect(() => { if (allPets) setPets(allPets); }, [allPets]);

  const activePets = pets.filter(p => p.estado === "activa");
  const recovered  = pets.filter(p => p.estado === "recuperada").length;
  const matchCount = pets.filter(p => p.match > 70).length;

  const filteredPets = pets.filter(p => {
    const s = search.toLowerCase();
    const matchSearch = !search || p.nombre.toLowerCase().includes(s) || p.zona.toLowerCase().includes(s) || p.raza.toLowerCase().includes(s);
    const matchFiltro = filtro === "todas" || p.tipo === filtro || p.estado === filtro;
    return matchSearch && matchFiltro;
  });

  // ── POST nueva mascota ─────────────────────────────────────────────────────
  const handleSubmit = async (body) => {
    try {
      const nueva = await api.post("/mascotas/", body);
      setPets(prev => [nueva, ...prev]);
      const txt = `🔔 Nuevo reporte: ${nueva.tipo === "perdida" ? "mascota perdida" : "mascota encontrada"} en ${nueva.zona || "zona sin especificar"}`;
      await api.post(`/alertas/?mensaje=${encodeURIComponent(txt)}&tipo=nuevo`, {});
      reloadAlerts();
      setNewAlert(txt);
      setTimeout(() => setNewAlert(null), 4000);
      return true;
    } catch (e) {
      alert("Error al conectar con el backend: " + e.message);
      return false;
    }
  };

  const NAV = [
    { id: "dashboard", icon: "📊", label: "Dashboard"    },
    { id: "mapa",      icon: "🗺️", label: "Mapa"         },
    { id: "mascotas",  icon: "🐾", label: "Mascotas"     },
    { id: "alertas",   icon: "🔔", label: `Alertas ${alertas ? `(${alertas.length})` : ""}` },
    { id: "ia",        icon: "🤖", label: "Motor IA"     },
    { id: "stack",     icon: "⚙️", label: "Arquitectura" },
  ];

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">

      {/* ── SIDEBAR ─────────────────────────────────────────────────────────── */}
      <div className="w-16 md:w-56 bg-gray-900 flex flex-col shrink-0">
        <div className="p-3 md:p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐾</span>
            <div className="hidden md:block">
              <p className="text-white font-bold text-sm leading-tight">Sanos y Salvos</p>
              <p className="text-gray-400 text-xs">FastAPI + React</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {NAV.map(n => (
            <button key={n.id} onClick={() => setVista(n.id)}
              className={`w-full flex items-center gap-3 px-2 md:px-3 py-2.5 rounded-lg text-sm transition ${vista === n.id ? "bg-teal-600 text-white font-medium" : "text-gray-400 hover:bg-gray-800 hover:text-white"}`}>
              <span className="text-base">{n.icon}</span>
              <span className="hidden md:block truncate">{n.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-2 md:p-3 border-t border-gray-700 space-y-1">
          <button onClick={() => setShowForm("perdida")}
            className="w-full bg-red-600 hover:bg-red-700 text-white rounded-lg px-2 md:px-3 py-2 text-xs font-bold flex items-center gap-2 transition">
            <span>🔍</span><span className="hidden md:block">Reportar perdida</span>
          </button>
          <button onClick={() => setShowForm("encontrada")}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-2 md:px-3 py-2 text-xs font-bold flex items-center gap-2 transition">
            <span>🐾</span><span className="hidden md:block">Reportar encontrada</span>
          </button>
        </div>
      </div>

      {/* ── MAIN ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b px-4 md:px-6 py-3 flex items-center justify-between shrink-0">
          <h1 className="font-bold text-gray-800 text-base md:text-lg">
            {NAV.find(n => n.id === vista)?.icon} {NAV.find(n => n.id === vista)?.label}
          </h1>
          <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="hidden md:inline">{API}</span>
          </div>
        </div>

        {newAlert && (
          <div className="mx-4 mt-3 bg-teal-600 text-white rounded-lg px-4 py-3 text-sm shadow-lg">{newAlert}</div>
        )}

        <div className="flex-1 overflow-y-auto p-4 md:p-6">

          {/* DASHBOARD */}
          {vista === "dashboard" && (
            <div className="space-y-5">
              {loadPets ? <Spinner /> : errPets ? <ErrorMsg msg={errPets} onRetry={reloadPets} /> : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: "Mascotas perdidas",    val: activePets.filter(p => p.tipo === "perdida").length,    icon: "🔍", color: "bg-red-500"    },
                      { label: "Mascotas encontradas", val: activePets.filter(p => p.tipo === "encontrada").length, icon: "🐾", color: "bg-orange-500" },
                      { label: "Recuperadas",          val: recovered,                                              icon: "✅", color: "bg-green-500"  },
                      { label: "Coincidencias IA",     val: matchCount,                                             icon: "🤖", color: "bg-purple-500" },
                    ].map(s => (
                      <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border">
                        <div className={`w-10 h-10 ${s.color} rounded-full flex items-center justify-center text-xl mb-2`}>{s.icon}</div>
                        <p className="text-2xl font-bold text-gray-800">{s.val}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 bg-white rounded-xl p-4 shadow-sm border">
                      <p className="font-bold text-gray-700 mb-1 text-sm">
                        Actividad mensual <span className="text-xs font-normal text-gray-400 font-mono">← GET /stats/mensual</span>
                      </p>
                      {loadStats ? <Spinner /> : statsMes && (
                        <ResponsiveContainer width="100%" height={180}>
                          <BarChart data={statsMes}>
                            <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Bar dataKey="perdidas"    fill="#F44336" name="Perdidas"    radius={[3,3,0,0]} />
                            <Bar dataKey="encontradas" fill="#FF9800" name="Encontradas" radius={[3,3,0,0]} />
                            <Bar dataKey="recuperadas" fill="#4CAF50" name="Recuperadas" radius={[3,3,0,0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border">
                      <p className="font-bold text-gray-700 mb-1 text-sm">
                        Por especie <span className="text-xs font-normal text-gray-400 font-mono">← GET /stats/especies</span>
                      </p>
                      {statsEsp && (
                        <>
                          <ResponsiveContainer width="100%" height={160}>
                            <PieChart>
                              <Pie data={statsEsp} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                                {statsEsp.map((e, i) => <Cell key={i} fill={e.color} />)}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="space-y-1 mt-2">
                            {statsEsp.map(d => (
                              <div key={d.name} className="flex items-center gap-2 text-xs">
                                <span className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                                <span className="text-gray-600">{d.name}</span>
                                <span className="ml-auto font-medium">{d.value}%</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-4 shadow-sm border">
                    <p className="font-bold text-gray-700 mb-3 text-sm">
                      🔔 Últimas alertas <span className="text-xs font-normal text-gray-400 font-mono">← GET /alertas/</span>
                    </p>
                    {loadAlerts ? <Spinner /> : errAlerts ? <ErrorMsg msg={errAlerts} onRetry={reloadAlerts} /> :
                      (alertas || []).slice(0, 3).map(a => (
                        <div key={a.id} className={`flex items-start gap-3 p-2 rounded-lg text-sm mb-2 ${a.tipo === "match" ? "bg-yellow-50" : a.tipo === "exito" ? "bg-green-50" : "bg-blue-50"}`}>
                          <p className="flex-1">{a.mensaje}</p>
                          <span className="text-xs text-gray-400 whitespace-nowrap">{a.tiempo}</span>
                        </div>
                      ))
                    }
                  </div>
                </>
              )}
            </div>
          )}

          {/* MAPA */}
          {vista === "mapa" && (
            <div className="space-y-3">
              <div className="bg-white rounded-xl p-3 shadow-sm border text-sm text-gray-600 flex gap-4 flex-wrap items-center">
                <span>📍 {activePets.length} activas</span>
                <span>🤖 {matchCount} coincidencias</span>
                <span className="text-xs text-gray-400 font-mono">GET /mascotas/ → markers</span>
              </div>
              {loadPets ? <Spinner /> : errPets ? <ErrorMsg msg={errPets} onRetry={reloadPets} /> : (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden" style={{ height: 460 }}>
                  <MapaMock pets={pets} onSelectPet={setSelectedPet} />
                </div>
              )}
            </div>
          )}

          {/* MASCOTAS */}
          {vista === "mascotas" && (
            <div className="space-y-4">
              <div className="flex gap-3 flex-wrap items-center">
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded font-mono hidden md:block">
                  GET /mascotas/?tipo=&estado=&search=
                </span>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  className="flex-1 min-w-48 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  placeholder="🔍 Buscar nombre, zona, raza..." />
                <select value={filtro} onChange={e => setFiltro(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm">
                  <option value="todas">Todas</option>
                  <option value="perdida">Perdidas</option>
                  <option value="encontrada">Encontradas</option>
                  <option value="recuperada">Recuperadas</option>
                </select>
              </div>
              {loadPets ? <Spinner /> : errPets ? <ErrorMsg msg={errPets} onRetry={reloadPets} /> : (
                <div className="grid md:grid-cols-2 gap-3">
                  {filteredPets.map(p => <PetCard key={p.id} pet={p} onSelect={setSelectedPet} />)}
                  {filteredPets.length === 0 && (
                    <div className="col-span-2 text-center py-12 text-gray-400">
                      <p className="text-4xl mb-2">🐾</p><p>Sin resultados</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ALERTAS */}
          {vista === "alertas" && (
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700 font-mono">
                GET /alertas/ → Firebase Cloud Messaging
              </div>
              {loadAlerts ? <Spinner /> : errAlerts ? <ErrorMsg msg={errAlerts} onRetry={reloadAlerts} /> :
                (alertas || []).map(a => (
                  <div key={a.id} className={`bg-white rounded-xl p-4 shadow-sm border flex items-start gap-3 ${a.tipo === "match" ? "border-l-4 border-yellow-400" : a.tipo === "exito" ? "border-l-4 border-green-400" : "border-l-4 border-blue-400"}`}>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">{a.mensaje}</p>
                      <p className="text-xs text-gray-400 mt-1">{a.tiempo}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${a.tipo === "match" ? "bg-yellow-100 text-yellow-700" : a.tipo === "exito" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                      {a.tipo}
                    </span>
                  </div>
                ))
              }
            </div>
          )}

          {/* MOTOR IA */}
          {vista === "ia" && (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-sm text-purple-800">
                <p className="font-bold mb-1">🤖 ia/matching.py — Pillow + imagehash</p>
                <p>Compara imágenes de mascotas perdidas vs encontradas. En producción: CNN entrenado + embeddings de descripción.</p>
              </div>
              {loadPets ? <Spinner /> : (
                <div className="bg-white rounded-xl p-4 shadow-sm border">
                  <p className="font-bold text-gray-700 mb-3 text-sm">
                    Coincidencias activas <span className="text-xs font-normal text-gray-400 font-mono">← GET /mascotas/matches</span>
                  </p>
                  {pets.filter(p => p.match > 60 && p.tipo === "perdida").map(p => {
                    const match = pets.find(m => m.tipo === "encontrada" && m.match > 60);
                    if (!match) return null;
                    return (
                      <div key={p.id} className="border border-yellow-200 bg-yellow-50 rounded-xl p-4 mb-3">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-3xl">{p.foto}</div>
                            <p className="text-xs font-medium text-red-600">PERDIDA</p>
                            <p className="text-xs text-gray-600">{p.nombre} · {p.zona}</p>
                          </div>
                          <div className="flex-1 text-center">
                            <div className="text-2xl font-bold text-yellow-600">{p.match}%</div>
                            <div className="text-xs text-gray-500">similitud</div>
                            <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-2 bg-yellow-400 rounded-full" style={{ width: `${p.match}%` }} />
                            </div>
                            <div className="text-xs text-purple-600 mt-1 font-mono">ia/matching.py</div>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl">{match.foto}</div>
                            <p className="text-xs font-medium text-orange-600">ENCONTRADA</p>
                            <p className="text-xs text-gray-600">{match.nombre} · {match.zona}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button className="flex-1 bg-green-500 text-white text-xs rounded-lg py-2 font-bold hover:bg-green-600">
                            ✅ Confirmar → PATCH /mascotas/{p.id}/estado
                          </button>
                          <button className="flex-1 border text-xs rounded-lg py-2 text-gray-600 hover:bg-gray-50">❌ Descartar</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="bg-white rounded-xl p-4 shadow-sm border">
                <p className="font-bold text-gray-700 mb-2 text-sm">Factores de análisis</p>
                {[
                  { factor: "Similitud de imagen (imagehash)", score: 82,  color: "#065A82" },
                  { factor: "Zona geográfica",                 score: 95,  color: "#02C39A" },
                  { factor: "Descripción textual (NLP)",       score: 78,  color: "#7B1FA2" },
                  { factor: "Especie y raza",                  score: 100, color: "#4CAF50" },
                  { factor: "Proximidad temporal",             score: 88,  color: "#FF9800" },
                ].map(f => (
                  <div key={f.factor} className="mb-2">
                    <div className="flex justify-between text-xs text-gray-600 mb-0.5">
                      <span>{f.factor}</span><span className="font-bold">{f.score}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-2 rounded-full" style={{ width: `${f.score}%`, background: f.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ARQUITECTURA */}
          {vista === "stack" && (
            <div className="space-y-3">
              <div className="bg-gray-800 rounded-xl p-4 text-sm text-gray-300">
                <p className="text-white font-bold mb-1">Arquitectura — Layered Architecture</p>
                <p className="text-gray-400 text-xs">Diagrama técnico pp. 17-18 · GPY1101</p>
              </div>
              {[
                { capa: "Presentación",    color: "#065A82", techs: ["React.js", "Recharts", "Tailwind CSS"],                       desc: "fetch() hacia localhost:8000 · sin mock data en frontend" },
                { capa: "Lógica Negocio", color: "#028090", techs: ["FastAPI", "routes/mascotas.py", "routes/alertas.py", "routes/stats.py"], desc: "API REST: GET/POST/PATCH · CORS habilitado" },
                { capa: "IA",             color: "#7B1FA2", techs: ["ia/matching.py", "Pillow", "imagehash"],                       desc: "Comparación hash de imágenes · GET /mascotas/matches" },
                { capa: "Datos",          color: "#388E3C", techs: ["PostgreSQL (producción)", "In-memory list (MVP)"],             desc: "db_mascotas y db_alertas en Python simulan la BD" },
                { capa: "Infraestructura",color: "#F57C00", techs: ["AWS EC2", "AWS S3", "Firebase", "Docker"],                    desc: "Cloud pública · CI/CD · almacenamiento de imágenes" },
                { capa: "Integración",    color: "#C62828", techs: ["Google Maps API", "Facebook/Instagram API", "FCM"],           desc: "Geolocalización, difusión RRSS y alertas push por zona" },
              ].map(layer => (
                <div key={layer.capa} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                  <div className="px-4 py-2.5 text-white font-bold text-sm" style={{ background: layer.color }}>{layer.capa}</div>
                  <div className="p-4">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {layer.techs.map(t => <span key={t} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full font-medium font-mono">{t}</span>)}
                    </div>
                    <p className="text-xs text-gray-500">{layer.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {showForm    && <FormReporte tipo={showForm} onClose={() => setShowForm(null)} onSubmit={handleSubmit} />}
      {selectedPet && <PetModal pet={selectedPet} allPets={pets} onClose={() => setSelectedPet(null)} />}
    </div>
  );
}
