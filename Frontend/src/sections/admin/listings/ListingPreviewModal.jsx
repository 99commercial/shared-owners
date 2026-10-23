import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { X, Loader2, MapPin, Eye, MessageSquare, Crown, AlertTriangle, Trash2, CheckSquare, HomeIcon, Landmark } from 'lucide-react';
import { adminApi } from '../../../services/endpoints';
import ConfirmDialog from '../../../components/admin/ConfirmDialog';
import AccountCell from '../../../components/admin/AccountCell';
import InfoTile from '../../../components/admin/InfoTile';
import { STATUS_STYLES, SECTION_LABELS, formatMoney, labelize } from '../../../data/propertyOptions';
import { formatDateTime } from '../../../utils/format';
import { adminAccountPath } from '../../../utils/adminPaths';

const plainText = (html) => {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent?.trim() || '';
};

const addressLine = (address = {}) =>
  [address.line1, address.line2, address.townCity, address.county, address.postcode].filter(Boolean).join(', ');

const KIND = {
  property: {
    fetch: (id) => adminApi.getProperty(id).then((r) => r.data.data),
    remove: (id) => adminApi.deleteProperty(id),
    label: 'property',
    icon: HomeIcon,
  },
  development: {
    fetch: (id) => adminApi.getDevelopment(id).then((r) => r.data.data),
    remove: (id) => adminApi.deleteDevelopment(id),
    label: 'development',
    icon: Landmark,
  },
};

function PropertyFacts({ property }) {
  const details = property.details || {};
  const description = property.description || {};
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <InfoTile label="Scheme" value={labelize(details.schemeType)} />
      <InfoTile label="Availability" value={labelize(details.availability)} />
      <InfoTile label="Property type" value={labelize(details.propertyType)} />
      <InfoTile label="Bedrooms" value={description.bedrooms} />
      <InfoTile label="Bathrooms" value={description.bathrooms} />
      <InfoTile label="Tenure" value={labelize(details.tenure)} />
      <InfoTile label="Full market value" value={details.pricing?.fullMarketValue ? formatMoney(details.pricing.fullMarketValue) : null} />
      <InfoTile label="Minimum share" value={details.minimumSharePercentage ? `${details.minimumSharePercentage}%` : null} />
      <InfoTile label="Monthly rent at min. share" value={details.pricing?.monthlyRentAtMinShare ? formatMoney(details.pricing.monthlyRentAtMinShare) : null} />
    </div>
  );
}

function DevelopmentFacts({ development }) {
  const details = development.details || {};
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <InfoTile label="Type" value={labelize(development.developmentType)} />
      <InfoTile label="Sales telephone" value={details.salesTelephone} />
      <InfoTile label="Sales email" value={details.salesEmail} />
      <InfoTile label="Homes for Londoners" value={development.syndication?.homesForLondoners ? 'Yes' : 'No'} />
      <InfoTile label="Brochures" value={details.brochures?.length || 0} />
      <InfoTile label="Images" value={development.images?.images?.length || 0} />
    </div>
  );
}

/**
 * Admin preview of a property or development (`kind`) with its owner and a
 * delete action. Opened from tables and dashboards via ?open=<id>.
 */
export default function ListingPreviewModal({ kind = 'property', id, onClose }) {
  const config = KIND[kind];
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', kind, id],
    queryFn: () => config.fetch(id),
  });

  const deleteMutation = useMutation({
    mutationFn: () => config.remove(id),
    onSuccess: () => {
      toast.success(`${labelize(config.label)} deleted`);
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || `Could not delete the ${config.label}`),
  });

  const listing = data?.[kind];
  const images = kind === 'property'
    ? listing?.gallery?.images || []
    : [...(listing?.images?.bannerImages || []), ...(listing?.images?.images || [])];
  const text = plainText(kind === 'property' ? listing?.description?.description || listing?.description?.summary : listing?.details?.description);
  const missing = listing?.completion?.missingSections || [];
  const Fallback = config.icon;

  return (
    <>
    <div className="fixed inset-0 z-50 bg-black/50 flex justify-end" onClick={onClose}>
      <aside className="w-full max-w-2xl h-full bg-white shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h3 className="font-bold text-ink">{labelize(config.label)} details</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
        </div>

        {isLoading ? (
          <div className="py-24 text-center"><Loader2 className="w-7 h-7 animate-spin text-brand-600 mx-auto" /></div>
        ) : error ? (
          <p className="p-10 text-center text-sm text-red-600">{error.response?.data?.message || 'Could not load this listing'}</p>
        ) : (
          <div className="p-6 space-y-6">
            {images.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {images.slice(0, 12).map((img, i) => (
                  <a key={img._id || img.url} href={img.url} target="_blank" rel="noreferrer" className="shrink-0">
                    <img src={img.url} alt={img.caption || ''} className={`${i === 0 ? 'w-72 h-48' : 'w-36 h-48'} object-cover rounded-xl bg-gray-100`} />
                  </a>
                ))}
              </div>
            ) : (
              <div className="h-40 rounded-xl bg-brand-50 text-brand-300 flex items-center justify-center"><Fallback className="w-12 h-12" /></div>
            )}

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`badge ${STATUS_STYLES[listing.status]}`}>{labelize(listing.status)}</span>
                {listing.isPremium && <span className="badge bg-amber-100 text-amber-700"><Crown className="w-3 h-3" /> Premium</span>}
                {listing.ownerType && <span className="badge bg-gray-100 text-gray-600">{labelize(listing.ownerType)} listing</span>}
                {listing.reference && <span className="text-xs text-gray-400 font-mono">Ref {listing.reference}</span>}
              </div>
              <h2 className="text-2xl font-extrabold text-ink">{listing.name || 'Untitled'}</h2>
              {addressLine(listing.address) && (
                <p className="text-sm text-gray-500 mt-1 flex items-start gap-1.5"><MapPin className="w-4 h-4 mt-0.5 shrink-0" />{addressLine(listing.address)}</p>
              )}
            </div>

            {listing.status === 'pending_approval' && listing.ownerType === 'user' && (
              <Link to="/admin/approvals" className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 hover:bg-amber-100">
                <CheckSquare className="w-5 h-5 shrink-0" />
                Waiting for approval ({labelize(listing.approval?.requestType)}) since {formatDateTime(listing.approval?.submittedAt)}. Review it in the approval queue.
              </Link>
            )}
            {listing.approval?.decision === 'rejected' && listing.approval?.reason && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <strong>Last rejected:</strong> {listing.approval.reason}
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-gray-100 p-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">Owner</div>
                {data.owner ? <AccountCell account={data.owner} to={adminAccountPath(data.owner)} /> : <span className="text-sm text-gray-400">Removed account</span>}
              </div>
              <div className="rounded-xl border border-gray-100 p-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">Created by</div>
                {data.createdBy ? <AccountCell account={data.createdBy} to={adminAccountPath(data.createdBy)} /> : <span className="text-sm text-gray-400">Removed account</span>}
              </div>
            </div>

            {kind === 'property' ? <PropertyFacts property={listing} /> : <DevelopmentFacts development={listing} />}

            {kind === 'property' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-gray-50 p-4 flex items-center gap-3">
                  <Eye className="w-5 h-5 text-brand-600" />
                  <div><div className="text-lg font-bold text-ink">{listing.stats?.views || 0}</div><div className="text-xs text-gray-500">Views</div></div>
                </div>
                <div className="rounded-xl bg-gray-50 p-4 flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-brand-600" />
                  <div><div className="text-lg font-bold text-ink">{listing.stats?.enquiries || 0}</div><div className="text-xs text-gray-500">Enquiries</div></div>
                </div>
              </div>
            )}

            {missing.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <div className="flex items-center gap-2 font-semibold mb-1"><AlertTriangle className="w-4 h-4" /> Incomplete</div>
                Missing: {missing.map((s) => SECTION_LABELS[s] || labelize(s)).join(', ')}
              </div>
            )}

            {text && (
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">Description</div>
                <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed line-clamp-[12]">{text}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
              <div>Created {formatDateTime(listing.createdAt)}</div>
              <div>Updated {formatDateTime(listing.updatedAt)}</div>
              {listing.publishedAt && <div>Published {formatDateTime(listing.publishedAt)}</div>}
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
              >
                <Trash2 className="w-4 h-4" /> Delete {config.label}
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
    {confirmDelete && (
      <ConfirmDialog
        title={`Delete “${listing?.name || 'this listing'}”?`}
        message={`The ${config.label} is removed from the platform and its owner can no longer see it.`}
        pending={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        onClose={() => setConfirmDelete(false)}
      />
    )}
    </>
  );
}
