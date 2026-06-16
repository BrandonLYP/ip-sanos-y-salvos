import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import { Spinner } from '../components/Spinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { useAuth } from '../context/AuthContext';
import api, { getMediaUrl } from '../services/api';

export function MascotaDetallePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: pet, loading, error, reload } = useFetch(`/mascotas/${id}`);
  const { data: matches } = useFetch('/mascotas/matches');
  const { data: avistamientos, reload: reloadAvi } = useFetch(`/mascotas/${id}/avistamientos/`);
  const [aviNota, setAviNota] = useState('');
  const [aviLoading, setAviLoading] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [zoomed, setZoomed] = useState(false);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage error={error} onRetry={reload} />;
  if (!pet) return <div className="text-center text-gray-500">Mascota no encontrada</div>;

  const myMatches = (matches || []).filter((m) => m.id === pet.id);
  const isOwner = user && user.id === pet.usuario_id;

  const handleMarcarRecuperada = async () => {
    try {
      await api.patch(`/mascotas/${pet.id}/estado`, { estado: 'recuperada' });
      reload();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleReportarAvistamiento = async (e) => {
    e.preventDefault();
    if (!aviNota.trim()) return;
    setAviLoading(true);
    try {
      await api.post(`/mascotas/${pet.id}/avistamientos/`, { nota: aviNota });
      setAviNota('');
      reloadAvi();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.detail || err.message));
    } finally {
      setAviLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-700">
        ← Volver
      </button>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {pet.foto_url ? (
          <img
            src={getMediaUrl(pet.foto_url)}
            alt={pet.nombre}
            className="w-full h-64 object-cover bg-gray-100 cursor-zoom-in"
            onClick={() => {
              setLightbox(getMediaUrl(pet.foto_url));
              setZoomed(false);
            }}
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
        ) : (
          <div className="w-full h-64 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-7xl">
            {pet.tipo === 'perdida' ? '🔍' : '🐾'}
          </div>
        )}

        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{pet.nombre}</h2>
              <p className="text-gray-500">
                {pet.especie} · {pet.raza} · {pet.color} · {pet.sexo} · {pet.edad}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span
                className={`text-xs px-3 py-1 rounded-full font-medium ${
                  pet.tipo === 'perdida' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                }`}
              >
                {pet.tipo === 'perdida' ? 'Perdida' : 'Encontrada'}
              </span>
              <span
                className={`text-xs px-3 py-1 rounded-full font-medium ${
                  pet.estado === 'recuperada' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                }`}
              >
                {pet.estado}
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <Info label="📍 Zona" value={pet.zona || '—'} />
            <Info label="📅 Fecha" value={pet.fecha || '—'} />
            <Info label="📝 Descripción" value={pet.descripcion || '—'} full />
            <Info label="📱 Contacto" value={pet.contacto || '—'} />
          </div>

          {pet.contacto && (
            <a
              href={`https://wa.me/${pet.contacto.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-green-500 hover:bg-green-600 text-white rounded-lg py-2 text-sm font-bold text-center"
            >
              💬 Contactar por WhatsApp
            </a>
          )}

          {isOwner && pet.estado !== 'recuperada' && (
            <button
              onClick={handleMarcarRecuperada}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg py-2 text-sm font-bold"
            >
              ✅ Marcar como recuperada
            </button>
          )}
        </div>
      </div>

      {myMatches.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="font-bold text-yellow-800 mb-2">🤖 Posibles coincidencias</p>
          {myMatches.map((m) => (
            <Link
              key={m.id}
              to={`/mascotas/${m.id}`}
              className="flex items-center gap-3 bg-white rounded-lg p-3 mb-2 hover:shadow"
            >
              <div className="text-2xl">🐾</div>
              <div className="flex-1">
                <p className="font-medium text-sm">
                  {m.nombre} · {m.zona}
                </p>
                <p className="text-xs text-gray-500">{m.descripcion}</p>
              </div>
              <span className="text-sm font-bold text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">
                {Math.round(m.match)}%
              </span>
            </Link>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border p-4">
        <p className="font-bold text-gray-700 mb-3">👀 Avistamientos</p>

        {user && pet.estado === 'activa' && (
          <form onSubmit={handleReportarAvistamiento} className="flex gap-2 mb-4">
            <input
              value={aviNota}
              onChange={(e) => setAviNota(e.target.value)}
              placeholder="¿Viste a esta mascota? Describe dónde y cuándo..."
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={aviLoading || !aviNota.trim()}
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-50"
            >
              Reportar
            </button>
          </form>
        )}

        {(avistamientos || []).length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Sin avistamientos aún</p>
        ) : (
          (avistamientos || []).map((a) => (
            <div key={a.id} className="border-l-2 border-teal-400 pl-3 py-2 mb-2">
              <p className="text-sm">{a.nota}</p>
              <p className="text-xs text-gray-400">
                {new Date(a.created_at).toLocaleString('es-CL')}
              </p>
            </div>
          ))
        )}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => {
            setLightbox(null);
            setZoomed(false);
          }}
        >
          <img
            src={lightbox}
            alt="foto ampliada"
            onClick={(e) => {
              e.stopPropagation();
              setZoomed((z) => !z);
            }}
            className={`max-w-full max-h-full object-contain rounded shadow-2xl transition-transform duration-200 ${
              zoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
            }`}
          />
          <button
            type="button"
            onClick={() => {
              setLightbox(null);
              setZoomed(false);
            }}
            className="absolute top-4 right-4 text-white text-3xl bg-black/40 hover:bg-black/70 rounded-full w-10 h-10 flex items-center justify-center"
            aria-label="Cerrar"
          >
            &times;
          </button>
        </div>
      )}
    </div>
  );
}

function Info({ label, value, full }) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm text-gray-800">{value}</p>
    </div>
  );
}
