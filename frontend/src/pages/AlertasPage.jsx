import { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import { Spinner } from '../components/Spinner';
import { Icon } from '../components/Icon';
import { markAlertasSeen } from '../hooks/useUnreadAlerts';

const TIPO_LABEL = {
  nuevo: 'Reporte',
  match: 'Coincidencia',
  exito: 'Recuperada',
};

const TIPO_BADGE = {
  nuevo: 'bg-blue-100 text-blue-700',
  match: 'bg-yellow-100 text-yellow-700',
  exito: 'bg-green-100 text-green-700',
};

const TIPO_ACCENT = {
  nuevo: 'border-l-blue-400',
  match: 'border-l-yellow-400',
  exito: 'border-l-green-400',
};

const TIPO_ICON = {
  nuevo: 'bell-fill',
  match: 'robot',
  exito: 'check-circle-fill',
};

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '');

export function AlertasPage() {
  const location = useLocation();
  const {
    data: mascotas,
    loading: loadingM,
    reload: reloadMascotas,
  } = useFetch('/mascotas/', {
    refetchOnFocus: true,
  });
  const {
    data: matches,
    loading: loadingMt,
    reload: reloadMatches,
  } = useFetch('/mascotas/matches', {
    refetchOnFocus: true,
  });

  useEffect(() => {
    reloadMascotas();
    reloadMatches();
    markAlertasSeen();
  }, [location.pathname, reloadMascotas, reloadMatches]);

  if (loadingM || loadingMt || !mascotas || !matches) return <Spinner />;

  const handleRefresh = () => {
    reloadMascotas();
    reloadMatches();
  };

  const recientes = [...mascotas]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 20);

  const nuevas = recientes.map((p) => ({
    id: `nueva-${p.id}`,
    tipo: 'nuevo',
    mascota: p,
  }));

  const matchAlerts = matches.map((m) => ({
    id: `match-${m.id}`,
    tipo: 'match',
    mascota: m,
    match: m.match,
  }));

  const successAlerts = mascotas
    .filter((m) => m.estado === 'recuperada')
    .map((m) => ({
      id: `exito-${m.id}`,
      tipo: 'exito',
      mascota: m,
    }));

  const all = [...nuevas, ...matchAlerts, ...successAlerts];

  if (all.length === 0) {
    return (
      <div className="text-center text-gray-400 py-12 inline-flex items-center gap-2 w-full justify-center">
        <Icon name="bell-slash" />
        Sin alertas por ahora
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700 flex items-center justify-between gap-2 w-full">
        <span className="inline-flex items-center gap-2">
          <Icon name="bell-fill" />
          Alertas generadas en tiempo real desde la base de datos
        </span>
        <button
          type="button"
          onClick={handleRefresh}
          className="text-blue-700 hover:text-blue-900 hover:bg-blue-100 rounded-lg px-2 py-1 text-xs font-medium inline-flex items-center gap-1"
        >
          <Icon name="arrow-clockwise" />
          Actualizar
        </button>
      </div>
      {all.map((a) => (
        <Link
          key={a.id}
          to={`/mascotas/${a.mascota.id}`}
          className={`block bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 ${TIPO_ACCENT[a.tipo]} p-4 hover:shadow-md transition`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-serif text-lg font-bold text-gray-900 tracking-tight">
                  {a.mascota.nombre || 'Sin nombre'}
                </span>
                <span className="text-xs text-gray-500 italic">
                  {a.mascota.especie}
                  {a.mascota.raza ? ` · ${a.mascota.raza}` : ''}
                </span>
              </div>

              {a.tipo === 'match' && a.match != null && (
                <p className="text-xs text-yellow-700 font-semibold mt-1">
                  {Math.round(a.match)}% de similitud con la BD
                </p>
              )}

              {a.tipo === 'exito' && (
                <p className="text-xs text-green-700 font-medium mt-1">
                  {capitalize(a.mascota.nombre || 'La mascota')} fue recuperada
                </p>
              )}

              {a.mascota.zona && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-teal-700 bg-teal-50 border border-teal-100 rounded-full px-2.5 py-0.5 font-medium">
                  <Icon name="geo-alt-fill" className="text-[11px]" />
                  <span className="capitalize">{a.mascota.zona}</span>
                </p>
              )}
            </div>

            <span
              className={`text-[11px] px-2.5 py-1 rounded-full font-semibold capitalize whitespace-nowrap inline-flex items-center gap-1 ${TIPO_BADGE[a.tipo]}`}
            >
              <Icon name={TIPO_ICON[a.tipo]} className="text-[11px]" />
              {TIPO_LABEL[a.tipo]}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
