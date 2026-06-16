import { useFetch } from '../hooks/useFetch';
import { Spinner } from '../components/Spinner';
import { Link } from 'react-router-dom';

const FACTORES = [
  { factor: 'Hash perceptual de imagen (imagehash)', score: 82, color: '#065A82' },
  { factor: 'Zona geográfica', score: 95, color: '#02C39A' },
  { factor: 'Especie y raza', score: 100, color: '#4CAF50' },
  { factor: 'Color', score: 78, color: '#7B1FA2' },
];

export function IaPage() {
  const { data: matches, loading } = useFetch('/mascotas/matches');

  if (loading) return <Spinner />;

  const matchesConEncontrada = (matches || []).filter((m) => m.match > 0);

  return (
    <div className="space-y-4">
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-sm text-purple-800">
        <p className="font-bold mb-1">🤖 Motor IA — imagehash (Pillow)</p>
        <p>
          Compara imágenes de mascotas perdidas vs encontradas usando perceptual hash. En
          producción: CNN/CLIP embeddings para mayor precisión.
        </p>
      </div>

      {matchesConEncontrada.length === 0 ? (
        <div className="bg-white rounded-xl p-8 shadow-sm border text-center text-gray-400">
          <p className="text-5xl mb-2">🔍</p>
          <p>No hay coincidencias activas. Sube fotos en tus reportes para activar el matching.</p>
        </div>
      ) : (
        matchesConEncontrada.map((p) => {
          const score = Math.round(p.match);
          return (
            <div key={p.id} className="border border-yellow-200 bg-yellow-50 rounded-xl p-4">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-3xl">🔍</div>
                  <p className="text-xs font-medium text-red-600">PERDIDA</p>
                  <p className="text-xs text-gray-600">
                    {p.nombre} · {p.zona}
                  </p>
                </div>
                <div className="flex-1 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{score}%</div>
                  <div className="text-xs text-gray-500">similitud</div>
                  <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-2 bg-yellow-400 rounded-full"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl">🐾</div>
                  <p className="text-xs font-medium text-orange-600">CANDIDATA</p>
                  <p className="text-xs text-gray-600">BD</p>
                </div>
              </div>
              <Link
                to={`/mascotas/${p.id}`}
                className="block mt-3 bg-yellow-500 hover:bg-yellow-600 text-white text-xs rounded-lg py-2 text-center font-bold"
              >
                Ver detalle →
              </Link>
            </div>
          );
        })
      )}

      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <p className="font-bold text-gray-700 mb-2 text-sm">Factores de análisis</p>
        {FACTORES.map((f) => (
          <div key={f.factor} className="mb-2">
            <div className="flex justify-between text-xs text-gray-600 mb-0.5">
              <span>{f.factor}</span>
              <span className="font-bold">{f.score}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-2 rounded-full"
                style={{ width: `${f.score}%`, background: f.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
