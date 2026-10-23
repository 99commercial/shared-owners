import { Link } from 'react-router-dom';
import { Eye, HomeIcon, Landmark, MessageSquare } from 'lucide-react';
import { STATUS_STYLES, labelize } from '../../data/propertyOptions';
import { accountName, timeAgo } from '../../utils/format';

/**
 * Compact property / development row for dashboard lists. `metric` picks the
 * number shown on the right: 'views', 'enquiries' or 'created'.
 */
export default function ListingRow({ listing, to, metric = 'created', kind = 'property', owner }) {
  const image = listing.searchSnapshot?.primaryImageUrl;
  const Fallback = kind === 'development' ? Landmark : HomeIcon;
  const place = [listing.address?.townCity, listing.address?.postcode].filter(Boolean).join(', ');

  return (
    <Link to={to} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 group">
      {image ? (
        <img src={image} alt="" className="w-14 h-11 rounded-lg object-cover shrink-0 bg-gray-100" />
      ) : (
        <div className="w-14 h-11 rounded-lg bg-brand-50 text-brand-400 flex items-center justify-center shrink-0">
          <Fallback className="w-5 h-5" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-ink truncate group-hover:text-brand-700">{listing.name || 'Untitled'}</div>
        <div className="text-xs text-gray-500 truncate">
          {[place, owner && accountName(owner)].filter(Boolean).join(' · ') || '—'}
        </div>
      </div>
      <span className={`badge shrink-0 hidden sm:inline-flex ${STATUS_STYLES[listing.status] || 'bg-gray-100 text-gray-600'}`}>{labelize(listing.status)}</span>
      <span className="text-xs text-gray-500 w-16 text-right shrink-0 inline-flex items-center justify-end gap-1">
        {metric === 'views' && <><Eye className="w-3.5 h-3.5" />{listing.stats?.views || 0}</>}
        {metric === 'enquiries' && <><MessageSquare className="w-3.5 h-3.5" />{listing.stats?.enquiries || 0}</>}
        {metric === 'created' && timeAgo(listing.createdAt)}
      </span>
    </Link>
  );
}
