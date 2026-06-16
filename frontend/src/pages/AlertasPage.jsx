import { useFetch } from '../hooks/useFetch';
import { Spinner } from '../components/Spinner';
import { ErrorMessage } from '../components/ErrorMessage';

export function AlertasPage() {
  const { data: mascotas } = useFetch('/mascotas/');
  const { data: matches } = useFetch('/mascotas/matches');

  if (!mascotas || !matches) return <Spinner />;

  const recientes = [...mascotas]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 5);

  const nuevas = recientes.map((p) => ({
    id: `nueva-${p.id}`,
    mensaje: `🔔 Nuevo reporte: ${p.tipo === 'perdida' ? 'mascota perdida' : 'mascota encontrada'} en ${p.zona || 'zona sin especificar'} — ${p.nombre}`,
    tiempo: 'Reciente',
    tipo: 'nuevo',
  }));

  const matchAlerts = matches.map((m) => ({
    id: `match-${m.id}`,
    mensaje: `🤖 Posible coincidencia IA (${Math.round(m.match)}%): ${m.nombre} en ${m.zona || 'zona'}`,
    tiempo: 'Coincidencia',
    tipo: 'match',
  }));

  const successAlerts = mascotas
    .filter((m) => m.estado === 'recuperada')
    .map((m) => ({
      id: `exito-${m.id}`,
      mensaje: `✅ ${m.nombre} fue recuperado/a`,
      tiempo: 'Éxito',
      tipo: 'exito',
    }));

  const all = [...nuevas, ...matchAlerts, ...successAlerts];

  if (all.length === 0) {
    return <div className="text-center text-gray-400 py-12">Sin alertas por ahora 🐾</div>;
  }

  return (
    <div className="space-y-3">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700">
        🔔 Alertas generadas en tiempo real desde la base de datos
      </div>
      {all.map((a) => (
        <div
          key={a.id}
          className={`bg-white rounded-xl p-4 shadow-sm border flex items-start gap-3 ${
            a.tipo === 'match'
              ? 'border-l-4 border-yellow-400'
              : a.tipo === 'exito'
              ? 'border-l-4 border-green-400'
              : 'border-l-4 border-blue-400'
          }`}
        >
          <div className="flex-1">
            <p className="text-sm text-gray-800">{a.mensaje}</p>
            <p className="text-xs text-gray-400 mt-1">{a.tiempo}</p>
          </div>
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${
              a.tipo === 'match'
                ? 'bg-yellow-100 text-yellow-700'
                : a.tipo === 'exito'
                ? 'bg-green-100 text-green-700'
                : 'bg-blue-100 text-blue-700'
            }`}
          >
            {a.tipo}
          </span>
        </div>
      ))}
    </div>
  );
}
