import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Eye, HomeIcon, MessageSquare, Trash2, Crown, AlertTriangle } from 'lucide-react';
import { adminApi } from '../../../services/endpoints';
import useListParams from '../../../hooks/useListParams';
import { DataTable, Pagination } from '../../../components/admin/DataTable';
import ListToolbar from '../../../components/admin/ListToolbar';
import AccountCell from '../../../components/admin/AccountCell';
import ConfirmDialog from '../../../components/admin/ConfirmDialog';
import ListingPreviewModal from './ListingPreviewModal';
import { OWNER_TYPE_OPTIONS } from '../../../data/adminOptions';
import { PROPERTY_STATUS_VALUES, STATUS_STYLES, formatMoney, labelize } from '../../../data/propertyOptions';
import { formatNumber, timeAgo } from '../../../utils/format';
import { adminAccountPath } from '../../../utils/adminPaths';

const STATUS_OPTIONS = PROPERTY_STATUS_VALUES.map((s) => ({ value: s, label: labelize(s) }));
const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest first' },
  { value: 'createdAt', label: 'Oldest first' },
  { value: 'name', label: 'Name A–Z' },
];

/**
 * Every property on the platform, or a slice of it: `fixed` adds filters that
 * are always applied (e.g. { owner } on a company page) and `hide` removes
 * columns / filters that would be redundant there ('owner', 'ownerType').
 * `prefix` keeps this table's URL params apart from others on the same page.
 */
export default function PropertiesTable({ fixed = {}, hide = [], prefix = '', emptyText = 'No properties match these filters' }) {
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [toDelete, setToDelete] = useState(null);
  const list = useListParams({ filters: ['status', 'ownerType', 'sort', 'development'], prefix });
  const query = { ...list.query, ...fixed };
  const openId = params.get(`${prefix}open`);

  const setOpen = (id) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (id) next.set(`${prefix}open`, id);
      else next.delete(`${prefix}open`);
      return next;
    }, { replace: true });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin', 'properties', query],
    queryFn: () => adminApi.getProperties(query).then((r) => r.data.data),
    placeholderData: keepPreviousData,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteProperty(id),
    onSuccess: () => {
      toast.success('Property deleted');
      setToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not delete the property'),
  });

  const columns = [
    {
      key: 'property',
      label: 'Property',
      render: (p) => (
        <button type="button" onClick={() => setOpen(p._id)} className="flex items-center gap-3 text-left group min-w-0">
          {p.searchSnapshot?.primaryImageUrl ? (
            <img src={p.searchSnapshot.primaryImageUrl} alt="" className="w-14 h-11 rounded-lg object-cover shrink-0 bg-gray-100" />
          ) : (
            <div className="w-14 h-11 rounded-lg bg-brand-50 text-brand-400 flex items-center justify-center shrink-0"><HomeIcon className="w-5 h-5" /></div>
          )}
          <div className="min-w-0">
            <div className="font-semibold text-ink truncate max-w-[240px] group-hover:text-brand-700 flex items-center gap-1">
              {p.isPremium && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
              {p.name || 'Untitled property'}
            </div>
            <div className="text-xs text-gray-500 truncate max-w-[240px]">
              {[p.address?.townCity, p.address?.postcode].filter(Boolean).join(', ') || '—'}
              {p.searchSnapshot?.fullMarketValue ? ` · ${formatMoney(p.searchSnapshot.fullMarketValue)}` : ''}
            </div>
          </div>
        </button>
      ),
    },
    !hide.includes('owner') && {
      key: 'owner',
      label: 'Owner',
      render: (p) => (p.owner ? (
        <div className="max-w-[200px]"><AccountCell account={p.owner} to={adminAccountPath(p.owner)} sub={labelize(p.ownerType)} /></div>
      ) : <span className="text-gray-400">Removed</span>),
    },
    !hide.includes('createdBy') && {
      key: 'createdBy',
      label: 'Created by',
      render: (p) => (p.createdBy && String(p.createdBy._id) !== String(p.owner?._id) ? (
        <div className="max-w-[180px]"><AccountCell account={p.createdBy} to={adminAccountPath(p.createdBy)} /></div>
      ) : <span className="text-xs text-gray-400">Owner</span>),
    },
    {
      key: 'status',
      label: 'Status',
      render: (p) => (
        <div className="flex flex-col items-start gap-1">
          <span className={`badge ${STATUS_STYLES[p.status]}`}>{labelize(p.status)}</span>
          {p.status === 'pending_approval' && p.approval?.requestType && (
            <span className="text-[11px] text-amber-700">{labelize(p.approval.requestType)} request</span>
          )}
          {p.completion && !p.completion.isComplete && (
            <span className="text-[11px] text-gray-500 inline-flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{p.completion.missingSections?.length || 0} sections missing</span>
          )}
        </div>
      ),
    },
    {
      key: 'stats',
      label: 'Views / enquiries',
      render: (p) => (
        <div className="flex items-center gap-3 text-xs text-gray-600">
          <span className="inline-flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{formatNumber(p.stats?.views)}</span>
          <span className="inline-flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" />{formatNumber(p.stats?.enquiries)}</span>
        </div>
      ),
    },
    { key: 'updated', label: 'Updated', render: (p) => <span className="text-xs text-gray-500 whitespace-nowrap">{timeAgo(p.updatedAt)}</span> },
    {
      key: 'actions',
      label: '',
      headClassName: 'text-right',
      className: 'text-right',
      render: (p) => (
        <div className="flex justify-end gap-0.5">
          <button type="button" title="View details" onClick={() => setOpen(p._id)} className="p-2 rounded-lg text-gray-500 hover:bg-brand-50 hover:text-brand-700"><Eye className="w-4 h-4" /></button>
          <button type="button" title="Delete" onClick={() => setToDelete(p)} className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ].filter(Boolean);

  const filters = [
    { key: 'status', value: list.filters.status, onChange: (v) => list.setFilter('status', v), options: STATUS_OPTIONS, placeholder: 'All statuses' },
    !hide.includes('ownerType') && { key: 'ownerType', value: list.filters.ownerType, onChange: (v) => list.setFilter('ownerType', v), options: OWNER_TYPE_OPTIONS, placeholder: 'All owners' },
    { key: 'sort', value: list.filters.sort, onChange: (v) => list.setFilter('sort', v), options: SORT_OPTIONS, placeholder: 'Recently updated' },
  ].filter(Boolean);

  return (
    <div className="dash-card overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <ListToolbar
          search={list.search}
          onSearch={list.setSearch}
          placeholder="Search by name, reference or postcode…"
          filters={filters}
          hasFilters={list.hasFilters}
          onClear={list.clear}
        />
        {list.filters.development && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-brand-50 border border-brand-200 px-3 py-1 text-xs text-brand-800">
            Showing homes in one development
            <button type="button" onClick={() => list.setFilter('development', '')} className="font-semibold hover:underline">Show all</button>
          </div>
        )}
      </div>
      <DataTable columns={columns} rows={data?.items} loading={isLoading} fetching={isFetching} empty={emptyText} minWidth={hide.length ? 760 : 1040} />
      <Pagination pagination={data?.pagination} page={list.page} limit={list.limit} onPage={list.setPage} onLimit={list.setLimit} />

      {openId && <ListingPreviewModal kind="property" id={openId} onClose={() => setOpen(null)} />}
      {toDelete && (
        <ConfirmDialog
          title={`Delete “${toDelete.name || 'this property'}”?`}
          message="The listing is removed from the platform and its owner can no longer see it."
          pending={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(toDelete._id)}
          onClose={() => setToDelete(null)}
        />
      )}
    </div>
  );
}
