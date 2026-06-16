import { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Marker } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useFetch } from '../hooks/useFetch';
import { Spinner } from '../components/Spinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { Icon } from '../components/Icon';

const SANTIAGO = [-33.4489, -70.6693];

const TIPO_COLOR = {
  perdida: '#F44336',
  encontrada: '#FF9800',
  recuperada: '#4CAF50',
};

const tipoIcon = (tipo) =>
  new L.DivIcon({
    className: 'mascota-marker',
    html: `<div style="width:32px;height:32px;border-radius:50%;background:${TIPO_COLOR[tipo] || '#999'};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:16px;"><i class="bi bi-${tipo === 'perdida' ? 'search' : 'paw-fill'}"></i></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

export function MapaPage() {
  const { data: pets, loading, error, reload } = useFetch('/mascotas/');

  const markers = useMemo(() => (pets || []).filter((p) => p.lat && p.lng), [pets]);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage error={error} onRetry={reload} />;

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-xl p-3 shadow-sm border text-sm text-gray-600 flex gap-4 flex-wrap items-center">
        <span className="inline-flex items-center gap-1">
          <Icon name="geo-alt-fill" />
          {markers.length} mascotas geolocalizadas
        </span>
        <span className="text-xs text-gray-400">Santiago, Chile</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden" style={{ height: 540 }}>
        <MapContainer center={SANTIAGO} zoom={12} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {markers.map((p) => (
            <Marker key={p.id} position={[p.lat, p.lng]} icon={tipoIcon(p.tipo)}>
              <Popup>
                <div className="text-sm">
                  <p className="font-bold">{p.nombre}</p>
                  <p className="text-xs text-gray-500">
                    {p.especie} · {p.zona}
                  </p>
                  <Link
                    to={`/mascotas/${p.id}`}
                    className="text-teal-600 text-xs font-medium hover:underline"
                  >
                    Ver detalle →
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
          {markers.length === 0 && (
            <CircleMarker
              center={SANTIAGO}
              radius={200}
              pathOptions={{ color: '#90CAF9', fillOpacity: 0.2 }}
            >
              <Popup>No hay mascotas geolocalizadas aún</Popup>
            </CircleMarker>
          )}
        </MapContainer>
      </div>
    </div>
  );
}
