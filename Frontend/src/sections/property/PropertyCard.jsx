import { Link } from 'react-router-dom';
import { ArrowRight, BedDouble, Building2, Home, MapPin, PieChart } from 'lucide-react';
import { formatMoney, labelize } from '../../data/propertyOptions';
import { AVAILABILITY_BADGE, addressLine, bedroomsLabel, shareValue } from '../../utils/listing';
import Tile from '../listing/CardTile';

/** Public listing card; `onHover` highlights the matching map pin */
export default function PropertyCard({ property, active = false, onHover }) {
  const snap = property.searchSnapshot || {};
  const fmv = snap.fullMarketValue;
  const share = snap.minimumSharePercentage;
  const from = shareValue(fmv, share);
  const owner = property.owner?.organisationProfile?.name;
  const to = `/properties/${property._id}`;

  return (
    <article
      onMouseEnter={() => onHover?.(property._id)}
      onMouseLeave={() => onHover?.(null)}
      className={`group flex flex-col rounded-2xl bg-white border-2 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl ${
        active ? 'border-brand-400 shadow-lg' : 'border-brand-100 shadow-sm'
      }`}
    >
      <Link to={to} className="relative block aspect-[16/10] bg-brand-50 overflow-hidden">
        {snap.primaryImageUrl ? (
          <img src={snap.primaryImageUrl} alt={property.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Home className="w-10 h-10 text-brand-200" /></div>
        )}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {snap.availability && (
            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm ${AVAILABILITY_BADGE[snap.availability] || 'bg-gray-700 text-white'}`}>
              {labelize(snap.availability)}
            </span>
          )}
          {snap.propertyType && (
            <span className="px-2.5 py-1 rounded-md bg-white/95 text-[10px] font-bold uppercase tracking-wider text-ink shadow-sm">{labelize(snap.propertyType)}</span>
          )}
        </div>
        {property.isPremium && (
          <span className="absolute top-3 right-3 px-2 py-1 rounded-md bg-amber-400 text-[10px] font-bold uppercase tracking-wider text-amber-950 shadow-sm">Featured</span>
        )}
      </Link>

      <div className="flex-1 flex flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-brand-600 truncate">{labelize(snap.schemeType) || 'Shared ownership'}</p>
          <div className="text-right shrink-0">
            <p className="text-lg font-extrabold text-ink leading-none">{fmv ? formatMoney(fmv) : 'POA'}</p>
            <p className="text-[11px] text-gray-500 mt-1">full market value</p>
          </div>
        </div>

        <h3 className="mt-2 text-base font-bold text-ink leading-snug line-clamp-2">
          <Link to={to} className="hover:text-brand-600">{property.name}</Link>
        </h3>
        <p className="flex items-start gap-1.5 mt-1.5 text-xs text-gray-500">
          <MapPin className="w-3.5 h-3.5 mt-px shrink-0 text-brand-400" />
          <span className="line-clamp-1">{addressLine(property.address) || 'Location on request'}</span>
        </p>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <Tile icon={BedDouble} label="Bedrooms" value={bedroomsLabel(snap.bedrooms)} />
          <Tile icon={PieChart} label="Share from" value={share ? `${share}%${from ? ` · ${formatMoney(from)}` : ''}` : null} />
        </div>

        {(property.development?.name || owner) && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {property.development?.name && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 text-[11px] font-medium text-gray-600"><Building2 className="w-3 h-3" />{property.development.name}</span>
            )}
            {owner && <span className="px-2 py-1 rounded-md bg-gray-100 text-[11px] font-medium text-gray-600">{owner}</span>}
          </div>
        )}

        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
            <span className="text-[11px] text-gray-400 truncate">{property.reference ? <>Ref: <b className="font-semibold text-gray-500">{property.reference}</b></> : ' '}</span>
            <Link to={to} className="inline-flex items-center gap-1.5 shrink-0 rounded-lg bg-brand-500 px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-600">
              View details <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
