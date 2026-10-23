import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

const UK_CENTER = [53.5, -2.2];

const escapeHtml = (text) =>
  String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const pinIcon = (label, active) =>
  L.divIcon({
    className: `listing-marker${active ? ' is-active' : ''}`,
    html: `<span class="listing-marker-pill">${escapeHtml(label)}</span>`,
    iconSize: [0, 0],
    iconAnchor: [0, 8],
    popupAnchor: [0, -30],
  });

/** Zooms to show every pin whenever the set of pins changes */
function FitToPoints({ points, maxZoom }) {
  const map = useMap();
  const key = points.map((p) => p.join(',')).join('|');
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) map.setView(points[0], maxZoom);
    else map.fitBounds(points, { padding: [48, 48], maxZoom });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map, maxZoom]);
  return null;
}

/** Leaflet only measures its container on window resize, so watch the container itself */
function ResizeWatcher() {
  const map = useMap();
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
}

/**
 * Listing map. Without `getLabel` the default Leaflet pin is used.
 * `activeId` highlights one pin (e.g. the card under the mouse).
 */
export default function ListingMap({
  items,
  getCoords,
  getLabel,
  renderPopup,
  activeId,
  onMarkerClick,
  maxZoom = 14,
  scrollWheelZoom = true,
  className = 'w-full h-full',
}) {
  const pins = useMemo(
    () => items.map((item) => ({ item, position: getCoords(item) })).filter((p) => p.position),
    [items, getCoords]
  );

  return (
    <div className={`isolate ${className}`}>
      <MapContainer center={pins[0]?.position || UK_CENTER} zoom={pins.length ? maxZoom : 6} scrollWheelZoom={scrollWheelZoom} className="w-full h-full" style={{ borderRadius: 0 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ResizeWatcher />
        <FitToPoints points={pins.map((p) => p.position)} maxZoom={maxZoom} />
        {pins.map(({ item, position }) => {
          const active = item._id === activeId;
          const label = getLabel?.(item);
          return (
            <Marker
              key={item._id}
              position={position}
              {...(label && { icon: pinIcon(label, active) })}
              zIndexOffset={active ? 1000 : 0}
              eventHandlers={onMarkerClick ? { click: () => onMarkerClick(item) } : undefined}
            >
              {renderPopup && <Popup>{renderPopup(item)}</Popup>}
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
