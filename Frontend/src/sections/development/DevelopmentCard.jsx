import { Link } from 'react-router-dom';
import { ArrowRight, BedDouble, Building2, Home, Landmark, MapPin } from 'lucide-react';
import { formatMoney, labelize } from '../../data/propertyOptions';
import { addressLine, bedroomsRange } from '../../utils/listing';
import Tile from '../listing/CardTile';

export default function DevelopmentCard({ development, active = false, onHover }) {
  const homes = development.homes || {};
  const owner = development.owner?.organisationProfile?.name;
  const image = development.searchSnapshot?.primaryImageUrl;
  const to = `/developments/${development._id}`;

  return (
    <article
      onMouseEnter={() => onHover?.(development._id)}
      onMouseLeave={() => onHover?.(null)}
      className={`group flex flex-col rounded-2xl bg-white border-2 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl ${
        active ? 'border-brand-400 shadow-lg' : 'border-brand-100 shadow-sm'
      }`}
    >
      <Link to={to} className="relative block aspect-[16/10] bg-brand-50 overflow-hidden">
        {image ? (
          <img src={image} alt={development.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Building2 className="w-10 h-10 text-brand-200" /></div>
        )}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm ${homes.available ? 'bg-emerald-500 text-white' : 'bg-gray-700 text-white'}`}>
            {homes.available ? `${homes.available} available` : homes.homes ? 'Fully reserved' : 'Coming soon'}
          </span>
          {development.developmentType && (
            <span className="px-2.5 py-1 rounded-md bg-white/95 text-[10px] font-bold uppercase tracking-wider text-ink shadow-sm">{labelize(development.developmentType)}</span>
          )}
        </div>
        {development.isPremium && (
          <span className="absolute top-3 right-3 px-2 py-1 rounded-md bg-amber-400 text-[10px] font-bold uppercase tracking-wider text-amber-950 shadow-sm">Featured</span>
        )}
      </Link>

      <div className="flex-1 flex flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-brand-600 truncate">{owner || 'New development'}</p>
          <div className="text-right shrink-0">
            <p className="text-lg font-extrabold text-ink leading-none">{homes.priceFrom ? formatMoney(homes.priceFrom) : 'TBC'}</p>
            <p className="text-[11px] text-gray-500 mt-1">{homes.priceFrom ? 'homes from' : 'prices to follow'}</p>
          </div>
        </div>

        <h3 className="mt-2 text-base font-bold text-ink leading-snug line-clamp-2">
          <Link to={to} className="hover:text-brand-600">{development.name}</Link>
        </h3>
        <p className="flex items-start gap-1.5 mt-1.5 text-xs text-gray-500">
          <MapPin className="w-3.5 h-3.5 mt-px shrink-0 text-brand-400" />
          <span className="line-clamp-1">{addressLine(development.address) || 'Location on request'}</span>
        </p>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <Tile icon={Home} label="Homes" value={homes.homes ? `${homes.homes} listed` : 'None yet'} />
          <Tile icon={BedDouble} label="Bedrooms" value={bedroomsRange(homes.bedroomsMin, homes.bedroomsMax)} />
        </div>

        {(development.address?.localAuthority || homes.minShare) && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {development.address?.localAuthority && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 text-[11px] font-medium text-gray-600"><Landmark className="w-3 h-3" />{development.address.localAuthority}</span>
            )}
            {homes.minShare && <span className="px-2 py-1 rounded-md bg-gray-100 text-[11px] font-medium text-gray-600">Shares from {homes.minShare}%</span>}
          </div>
        )}

        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
            <span className="text-[11px] text-gray-400 truncate">{development.address?.postcode || ' '}</span>
            <Link to={to} className="inline-flex items-center gap-1.5 shrink-0 rounded-lg bg-brand-500 px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-600">
              View details <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
