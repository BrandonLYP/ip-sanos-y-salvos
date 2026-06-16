export function Spinner({ label = 'Cargando...' }) {
  return (
    <div className="flex items-center justify-center py-12 text-gray-400">
      <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mr-3" />
      {label}
    </div>
  );
}
