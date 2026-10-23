import { ExternalLink, MapPin } from 'lucide-react';
import { toLatLng } from '../../../utils/listing';
import DetailCard from './DetailCard';
import ListingMap from '../ListingMap';

const getCoords = (item) => toLatLng(item.location);

export default function LocationCard({ id, address = {}, location, title }) {
  const point = toLatLng(location);
  const query = point ? point.join(',') : [address.line1, address.townCity, address.postcode].filter(Boolean).join(', ');
  const mapsUrl = query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : null;
  const rows = [
    ['Address', [address.line1, address.line2].filter(Boolean).join(', ')],
    ['Town / city', address.townCity],
    ['Local authority', address.localAuthority],
    ['Postcode', address.postcode],
  ].filter(([, value]) => value);

  return (
    <DetailCard
      title="Location & map"
      icon={MapPin}
      id="location"
      action={mapsUrl && (
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700">
          Open in Google Maps <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    >
      {rows.length > 0 && (
        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {rows.map(([label, value]) => (
            <div key={label} className="rounded-xl bg-gray-50 border border-gray-100 px-3.5 py-3">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</dt>
              <dd className="text-sm font-semibold text-ink mt-0.5">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {point ? (
        <div className="h-80 rounded-xl overflow-hidden border border-gray-200">
          <ListingMap items={[{ _id: id, location }]} getCoords={getCoords} maxZoom={15} scrollWheelZoom={false} renderPopup={() => <span className="text-sm font-semibold">{title}</span>} />
        </div>
      ) : (
        <div className="h-40 rounded-xl bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center text-sm text-gray-400">The exact location will be shared on enquiry</div>
      )}
    </DetailCard>
  );
}
