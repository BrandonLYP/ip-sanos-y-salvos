import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useFetch } from '../hooks/useFetch';
import { Spinner } from '../components/Spinner';
import { ErrorMessage } from '../components/ErrorMessage';

export function DashboardPage() {
  const { data: pets, loading, error, reload } = useFetch('/mascotas/');
  const { data: statsMes } = useFetch('/stats/mensual');
  const { data: statsEsp } = useFetch('/stats/especies');
  const { data: resumen } = useFetch('/stats/resumen');

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage error={error} onRetry={reload} />;

  const activas = (pets || []).filter((p) => p.estado === 'activa');
  const recuperadas = (pets || []).filter((p) => p.estado === 'recuperada').length;
  const matchCount = (pets || []).filter((p) => p.match > 70).length;

  const cards = [
    { label: 'Mascotas perdidas', val: activas.filter((p) => p.tipo === 'perdida').length, icon: '🔍', color: 'bg-red-500' },
    { label: 'Mascotas encontradas', val: activas.filter((p) => p.tipo === 'encontrada').length, icon: '🐾', color: 'bg-orange-500' },
    { label: 'Recuperadas', val: recuperadas, icon: '✅', color: 'bg-green-500' },
    { label: 'Coincidencias IA', val: matchCount, icon: '🤖', color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border">
            <div className={`w-10 h-10 ${s.color} rounded-full flex items-center justify-center text-xl mb-2`}>
              {s.icon}
            </div>
            <p className="text-2xl font-bold text-gray-800">{s.val}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {resumen && (
        <div className="bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-100 rounded-xl p-4 text-sm">
          <p className="text-gray-700">
            <strong>Tasa de recuperación:</strong> {resumen.tasa_recuperacion}% ·{' '}
            <strong>Total reportadas:</strong> {resumen.total} ·{' '}
            <strong>Activas:</strong> {resumen.activas}
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white rounded-xl p-4 shadow-sm border">
          <p className="font-bold text-gray-700 mb-1 text-sm">Actividad mensual</p>
          {statsMes && (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={statsMes}>
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="perdidas" fill="#F44336" name="Perdidas" radius={[3, 3, 0, 0]} />
                <Bar dataKey="encontradas" fill="#FF9800" name="Encontradas" radius={[3, 3, 0, 0]} />
                <Bar dataKey="recuperadas" fill="#4CAF50" name="Recuperadas" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <p className="font-bold text-gray-700 mb-1 text-sm">Por especie</p>
          {statsEsp && (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={statsEsp} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                    {statsEsp.map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {statsEsp.map((d) => (
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
    </div>
  );
}
