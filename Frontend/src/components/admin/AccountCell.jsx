import { Link } from 'react-router-dom';
import { accountAvatar, accountName } from '../../utils/format';

const SIZES = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-16 h-16 text-xl', xl: 'w-20 h-20 text-2xl' };

export function Avatar({ account, size = 'md', className = '' }) {
  const src = accountAvatar(account);
  const name = accountName(account);
  const square = account?.role === 'organisation' || account?.organisationProfile;
  return src ? (
    <img src={src} alt="" className={`${SIZES[size]} ${square ? 'rounded-xl object-contain bg-white border border-gray-200' : 'rounded-full object-cover'} shrink-0 ${className}`} />
  ) : (
    <div className={`${SIZES[size]} ${square ? 'rounded-xl' : 'rounded-full'} bg-brand-100 text-brand-700 font-bold flex items-center justify-center shrink-0 uppercase ${className}`}>
      {name.charAt(0)}
    </div>
  );
}

/** Avatar + name + secondary line (email by default); links to the detail page when `to` is set */
export default function AccountCell({ account, to, sub, size = 'sm' }) {
  const name = accountName(account);
  const content = (
    <>
      <Avatar account={account} size={size} />
      <div className="min-w-0">
        <div className={`font-semibold text-ink truncate ${to ? 'group-hover:text-brand-700' : ''}`}>{name}</div>
        <div className="text-xs text-gray-500 truncate">{sub ?? account?.email}</div>
      </div>
    </>
  );
  return to ? (
    <Link to={to} className="group flex items-center gap-3 min-w-0">{content}</Link>
  ) : (
    <div className="flex items-center gap-3 min-w-0">{content}</div>
  );
}
