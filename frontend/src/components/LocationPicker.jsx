import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon } from './Icon';

const SANTIAGO = [-33.4489, -70.6693];
const DEFAULT_ZOOM = 12;

const pinIcon = new L.DivIcon({
  className: 'mascota-picker-pin',
  html: '<div style="width:24px;height:24px;border-radius:50%;background:#F44336;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function Recenter({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, Math.max(map.getZoom(), DEFAULT_ZOOM));
  }, [position, map]);
  return null;
}

export function LocationPicker({ lat, lng, onChange }) {
  const markerRef = useRef(null);
  const position = lat != null && lng != null ? [lat, lng] : null;

  return (
    <div className="space-y-2">
      <div className="rounded-lg overflow-hidden border" style={{ height: 220 }}>
        <MapContainer
          center={SANTIAGO}
          zoom={DEFAULT_ZOOM}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={(la, ln) => onChange(la, ln)} />
          {position && (
            <>
              <Recenter position={position} />
              <Marker
                ref={markerRef}
                position={position}
                icon={pinIcon}
                draggable
                eventHandlers={{
                  dragend: (e) => {
                    const m = e.target;
                    onChange(m.getLatLng().lat, m.getLatLng().lng);
                  },
                }}
              />
            </>
          )}
        </MapContainer>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className="inline-flex items-center gap-1">
          <Icon name="geo-alt-fill" />
          {position
            ? `${lat.toFixed(4)}, ${lng.toFixed(4)}`
            : 'Haz click en el mapa para marcar la ubicacion'}
        </span>
        {position && (
          <button
            type="button"
            onClick={() => onChange(null, null)}
            className="text-red-600 hover:underline"
          >
            Quitar ubicacion
          </button>
        )}
      </div>
    </div>
  );
}
