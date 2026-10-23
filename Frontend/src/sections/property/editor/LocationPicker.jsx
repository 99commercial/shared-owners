import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

const UK_CENTER = [54.0, -2.5];

function ClickHandler({ onPick }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

function Recenter({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, Math.max(map.getZoom(), 14));
  }, [position, map]);
  return null;
}

/** `lat` / `lng` are numbers or undefined; `onPick(lat, lng)` fires on map click */
export default function LocationPicker({ lat, lng, onPick, disabled }) {
  const position = Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;

  return (
    <div className="h-72 rounded-xl overflow-hidden border border-gray-200 isolate">
      <MapContainer center={position || UK_CENTER} zoom={position ? 14 : 5} className="w-full h-full">
        <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {!disabled && <ClickHandler onPick={onPick} />}
        {position && <Marker position={position} />}
        <Recenter position={position} />
      </MapContainer>
    </div>
  );
}
