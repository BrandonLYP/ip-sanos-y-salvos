import { useMemo, useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import { Spinner } from '../components/Spinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { PetCard } from '../components/PetCard';
import { Icon } from '../components/Icon';

export function MascotasPage() {
  const { data: pets, loading, error, reload } = useFetch('/mascotas/');
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState('todas');

  const filtered = useMemo(() => {
    return (pets || []).filter((p) => {
      const s = search.toLowerCase();
      const matchSearch =
        !search ||
        p.nombre.toLowerCase().includes(s) ||
        (p.zona || '').toLowerCase().includes(s) ||
        (p.raza || '').toLowerCase().includes(s);
      const matchFiltro = filtro === 'todas' || p.tipo === filtro || p.estado === filtro;
      return matchSearch && matchFiltro;
    });
  }, [pets, search, filtro]);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage error={error} onRetry={reload} />;

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-48">
          <Icon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            placeholder="Buscar nombre, zona, raza..."
          />
        </div>
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="todas">Todas</option>
          <option value="perdida">Perdidas</option>
          <option value="encontrada">Encontradas</option>
          <option value="recuperada">Recuperadas</option>
        </select>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {filtered.map((p) => (
          <PetCard key={p.id} pet={p} />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-12 text-gray-400">
            <Icon name="paw-fill" className="text-4xl mb-2 text-gray-300" />
            <p>Sin resultados</p>
          </div>
        )}
      </div>
    </div>
  );
}
