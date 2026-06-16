export function ErrorMessage({ error, onRetry }) {
  const message = error?.response?.data?.detail || error?.message || 'Error desconocido';
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-center gap-3">
      <span>⚠️</span>
      <div className="flex-1">
        <p className="font-bold">No se pudo completar la operación</p>
        <p className="text-xs mt-0.5">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-red-100 hover:bg-red-200 px-3 py-1 rounded-lg whitespace-nowrap"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
