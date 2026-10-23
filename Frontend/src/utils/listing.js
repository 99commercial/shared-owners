import { formatMoney, labelize } from '../data/propertyOptions';

/** GeoJSON [lng, lat] to Leaflet [lat, lng] */
export const toLatLng = (location) => {
  const c = location?.coordinates;
  return Array.isArray(c) && c.length === 2 ? [c[1], c[0]] : null;
};

export const addressLine = (address = {}, { full = false } = {}) =>
  (full
    ? [address.line1, address.line2, address.townCity, address.localAuthority, address.postcode]
    : [address.line1, address.townCity, address.postcode]
  ).filter(Boolean).join(', ');

export const bedroomsLabel = (n) => {
  if (n === undefined || n === null) return null;
  if (n === 0) return 'Studio';
  return `${n} bed${n === 1 ? '' : 's'}`;
};

export const bedroomsRange = (min, max) => {
  if (min === null || min === undefined) return null;
  if (min === max) return bedroomsLabel(min);
  return `${min === 0 ? 'Studio' : min}–${max} beds`;
};

/** £400k / £1.25m, for map pins */
export const compactMoney = (pounds) => {
  if (!pounds && pounds !== 0) return null;
  if (pounds >= 1_000_000) return `£${(pounds / 1_000_000).toFixed(pounds % 1_000_000 ? 2 : 0).replace(/\.?0+$/, '')}m`;
  if (pounds >= 1_000) return `£${Math.round(pounds / 1_000)}k`;
  return `£${pounds}`;
};

export const shareValue = (fullMarketValue, sharePercentage) =>
  fullMarketValue && sharePercentage ? Math.round((fullMarketValue * sharePercentage) / 100) : null;

export const unitSizeLabel = (unitSize) =>
  unitSize?.value ? `${unitSize.value.toLocaleString('en-GB')} ${unitSize.scale === 'sq_m' ? 'sq m' : 'sq ft'}` : null;

export const floorLabel = (floor) => {
  if (floor === undefined || floor === null) return null;
  if (floor === -1) return 'Basement';
  if (floor < -1) return 'Lower ground';
  if (floor === 0) return 'Ground floor';
  const suffix = ['th', 'st', 'nd', 'rd'][(floor % 100 > 10 && floor % 100 < 14) || floor % 10 > 3 ? 0 : floor % 10];
  return `${floor}${suffix} floor`;
};

export const yesNo = (value) => (value === true ? 'Yes' : value === false ? 'No' : null);

export const fileSize = (bytes) => {
  if (!bytes) return null;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const AVAILABILITY_BADGE = {
  available: 'bg-emerald-500 text-white',
  coming_soon: 'bg-sky-500 text-white',
  under_offer: 'bg-amber-500 text-white',
  sold: 'bg-gray-700 text-white',
};

export const availabilityLabel = (value) => (value ? labelize(value) : null);

/** YouTube / Vimeo watch links to an embeddable player URL, or null */
export const videoEmbedUrl = (provider, url) => {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (provider === 'youtube' || /youtube\.com|youtu\.be/.test(u.hostname)) {
      const id = u.hostname.includes('youtu.be')
        ? u.pathname.slice(1)
        : u.searchParams.get('v') || u.pathname.split('/').filter(Boolean).pop();
      return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : null;
    }
    if (provider === 'vimeo' || /vimeo\.com/.test(u.hostname)) {
      const id = u.pathname.split('/').filter(Boolean).find((part) => /^\d+$/.test(part));
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
};

export const ELIGIBILITY_VALUE = {
  money: (v) => formatMoney(v),
  age: (v) => `${v}+`,
  text: (v) => v,
  boolean: (v) => (v ? 'Required' : 'Not required'),
};

export const enquiryMailto = (email, { subject, listingUrl, name }) => {
  const body = `Hello,\n\nI'm interested in ${name} (${listingUrl}). Please could you send me more information and let me know about viewings?\n\nThank you`;
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

export const telHref = (phone) => `tel:${String(phone).replace(/[^\d+]/g, '')}`;

export const PRICE_BANDS = [
  { value: '0-150000', label: 'Up to £150,000' },
  { value: '150000-250000', label: '£150,000 – £250,000' },
  { value: '250000-350000', label: '£250,000 – £350,000' },
  { value: '350000-500000', label: '£350,000 – £500,000' },
  { value: '500000-750000', label: '£500,000 – £750,000' },
  { value: '750000-', label: '£750,000+' },
];

/** '150000-250000' to { minPrice, maxPrice } */
export const priceBandQuery = (band) => {
  if (!band) return {};
  const [min, max] = band.split('-');
  return { ...(Number(min) > 0 && { minPrice: min }), ...(max && { maxPrice: max }) };
};
