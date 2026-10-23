const PROFILE_KEYS = ['userProfile', 'organisationAdminProfile', 'organisationUserProfile', 'adminProfile'];

export const profileOf = (account) =>
  account?.organisationProfile || PROFILE_KEYS.map((k) => account?.[k]).find(Boolean) || {};

/** Display name of any account (organisation name, or first + last name, or email) */
export const accountName = (account) => {
  if (!account) return '—';
  if (account.deleted) return 'Removed account';
  if (account.role === 'organisation' || account.organisationProfile) {
    return account.organisationProfile?.name || account.email || 'Organisation';
  }
  const p = profileOf(account);
  return p.firstName ? `${p.firstName} ${p.lastName || ''}`.trim() : account.email?.split('@')[0] || 'Account';
};

export const accountAvatar = (account) => {
  const p = profileOf(account);
  return p.logoUrl || p.avatarUrl;
};

/** Status pill for an account: deactivated, waiting (unverified) or active */
export const accountStatus = (account) => {
  if (account?.isActive === false) return { label: 'Deactivated', className: 'bg-red-100 text-red-700' };
  if (account?.isVerified === false) {
    return account.role === 'organisation-user'
      ? { label: 'Awaiting approval', className: 'bg-amber-100 text-amber-700' }
      : { label: 'Email not verified', className: 'bg-amber-100 text-amber-700' };
  }
  return { label: 'Active', className: 'bg-green-100 text-green-700' };
};

export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const formatDateTime = (d) =>
  d
    ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

export const formatTime = (d) =>
  d ? new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';

export const timeAgo = (date) => {
  if (!date) return '—';
  const minutes = Math.round((Date.now() - new Date(date).getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)}h ago`;
  if (minutes < 60 * 24 * 30) return `${Math.round(minutes / (60 * 24))}d ago`;
  return formatDate(date);
};

export const formatNumber = (n) => new Intl.NumberFormat('en-GB').format(n || 0);

export const formatCompact = (n) =>
  new Intl.NumberFormat('en-GB', { notation: 'compact', maximumFractionDigits: 1 }).format(n || 0);

export const percent = (part, whole) => (whole ? Math.round((part / whole) * 100) : 0);

/** "Chrome on macOS (desktop)" from a session's parsed device */
export const deviceLabel = (device) => {
  if (!device) return 'Unknown device';
  const parts = [device.browser, device.os && `on ${device.os}`].filter(Boolean).join(' ');
  return parts ? `${parts}${device.deviceType ? ` (${device.deviceType})` : ''}` : device.deviceType || 'Unknown device';
};

/** "12 Oct" axis label for a YYYY-MM-DD key */
export const shortDay = (key) =>
  new Date(`${key}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
