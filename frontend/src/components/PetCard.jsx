import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getMediaUrl } from '../services/api';

export function PetCard({ pet, onSelect }) {
  const [imgError, setImgError] = useState(false);
  const badgeColor = pet.tipo === 'perdida' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700';
  const estadoColor = pet.estado === 'recuperada' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700';

  const photoSrc = pet.foto_url && !imgError ? getMediaUrl(pet.foto_url) : null;

  return (
    <Link
      to={`/mascotas/${pet.id}`}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition block"
    >
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 flex-shrink-0 bg-gray-100 rounded-lg flex items-center justify-center text-2xl overflow-hidden">
          {photoSrc ? (
            <img
              src={photoSrc}
              alt={pet.nombre}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{pet.tipo === 'perdida' ? '🔍' : '🐾'}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-gray-800 truncate">{pet.nombre}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeColor}`}>
              {pet.tipo === 'perdida' ? 'Perdida' : 'Encontrada'}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoColor}`}>
              {pet.estado}
            </span>
            {pet.match > 70 && (
              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-yellow-100 text-yellow-700 animate-pulse">
                🤖 Match {Math.round(pet.match)}%
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {pet.raza} · {pet.color} · {pet.sexo}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            📍 {pet.zona || 'Sin zona'} · {pet.fecha}
          </p>
          {pet.descripcion && (
            <p className="text-xs text-gray-500 mt-1 truncate">{pet.descripcion}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
