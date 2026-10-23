import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Check, Eye, HomeIcon, X, Loader2 } from 'lucide-react';
import { adminApi } from '../../../services/endpoints';
import useListParams from '../../../hooks/useListParams';
import PageHero from '../../../components/PageHero';
import { DataTable, Pagination } from '../../../components/admin/DataTable';
import ListToolbar from '../../../components/admin/ListToolbar';
import AccountCell from '../../../components/admin/AccountCell';
import ConfirmDialog from '../../../components/admin/ConfirmDialog';
import ListingPreviewModal from '../../../sections/admin/listings/ListingPreviewModal';
import { formatMoney } from '../../../data/propertyOptions';
import { formatDateTime, timeAgo } from '../../../utils/format';
import { adminAccountPath } from '../../../utils/adminPaths';

const TABS = [
  { key: '', label: 'All requests' },
  { key: 'create', label: 'New listings' },
  { key: 'edit', label: 'Edits to live listings' },
];

export default function AdminApprovalsPage() {
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [rejecting, setRejecting] = useState(null);
  const list = useListParams({ filters: ['approvalType'] });
  const openId = params.get('open');
  const setOpen = (id) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (id) next.set('open', id);
      else next.delete('open');
      return next;
    }, { replace: true });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin', 'approvals', list.query],
    queryFn: () => adminApi.getApprovals(list.query).then((r) => r.data.data),
    placeholderData: keepPreviousData,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin'] });
  const approve = useMutation({
    mutationFn: (id) => adminApi.approveProperty(id),
    onSuccess: () => { toast.success('Approved — the listing is live'); refresh(); },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not approve'),
  });
  const reject = useMutation({
    mutationFn: ({ id, reason }) => adminApi.rejectProperty(id, { reason }),
    onSuccess: () => { toast.success('Rejected — the owner will see your reason'); setRejecting(null); refresh(); },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not reject'),
  });

  const columns = [
    {
      key: 'property',
      label: 'Listing',
      render: (p) => (
        <button type="button" onClick={() => setOpen(p._id)} className="flex items-center gap-3 text-left group">
          {p.searchSnapshot?.primaryImageUrl ? (
            <img src={p.searchSnapshot.primaryImageUrl} alt="" className="w-14 h-11 rounded-lg object-cover shrink-0" />
          ) : (
            <div className="w-14 h-11 rounded-lg bg-brand-50 text-brand-400 flex items-center justify-center shrink-0"><HomeIcon className="w-5 h-5" /></div>
          )}
          <div className="min-w-0">
            <div className="font-semibold text-ink truncate max-w-[240px] group-hover:text-brand-700">{p.name || 'Untitled property'}</div>
            <div className="text-xs text-gray-500 truncate max-w-[240px]">
              {[p.address?.townCity, p.address?.postcode].filter(Boolean).join(', ') || '—'}
              {p.searchSnapshot?.fullMarketValue ? ` · ${formatMoney(p.searchSnapshot.fullMarketValue)}` : ''}
            </div>
          </div>
        </button>
      ),
    },
    {
      key: 'owner',
      label: 'Submitted by',
      render: (p) => (p.owner ? <div className="max-w-[220px]"><AccountCell account={p.owner} to={adminAccountPath(p.owner)} /></div> : '—'),
    },
    {
      key: 'type',
      label: 'Request',
      render: (p) => (
        <span className={`badge ${p.approval?.requestType === 'edit' ? 'bg-violet-100 text-violet-700' : 'bg-brand-100 text-brand-700'}`}>
          {p.approval?.requestType === 'edit' ? 'Edit' : 'New listing'}
        </span>
      ),
    },
    {
      key: 'submitted',
      label: 'Waiting',
      render: (p) => (
        <div className="text-xs">
          <div className="font-semibold text-ink">{timeAgo(p.approval?.submittedAt)}</div>
          <div className="text-gray-500">{formatDateTime(p.approval?.submittedAt)}</div>
        </div>
      ),
    },
    {
      key: 'actions',
      label: '',
      headClassName: 'text-right',
      render: (p) => {
        const busy = approve.isPending && approve.variables === p._id;
        return (
          <div className="flex justify-end gap-1.5">
            <button type="button" title="Preview" onClick={() => setOpen(p._id)} className="p-2 rounded-lg text-gray-500 hover:bg-brand-50 hover:text-brand-700"><Eye className="w-4 h-4" /></button>
            <button
              type="button"
              disabled={busy}
              onClick={() => approve.mutate(p._id)}
              className="inline-flex items-center gap-1 rounded-lg bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Approve
            </button>
            <button
              type="button"
              onClick={() => setRejecting(p)}
              className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 text-xs font-semibold"
            >
              <X className="w-3.5 h-3.5" /> Reject
            </button>
          </div>
        );
      },
    },
  ];

  const active = list.filters.approvalType;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHero
        label="Listings"
        title="Approval queue"
        subtitle="Listings from individual users go live only after an admin approves them"
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Approvals' }]}
        tabs={TABS.map((t) => ({ key: t.key || 'all', label: t.label }))}
        activeTab={active || 'all'}
        onTabChange={(key) => list.setFilter('approvalType', key === 'all' ? '' : key)}
      />
      <div className="dash-card overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <ListToolbar search={list.search} onSearch={list.setSearch} placeholder="Search by name, reference or postcode…" hasFilters={Boolean(list.search)} onClear={list.clear} />
        </div>
        <DataTable columns={columns} rows={data?.items} loading={isLoading} fetching={isFetching} empty="The queue is empty — nothing is waiting for review" />
        <Pagination pagination={data?.pagination} page={list.page} limit={list.limit} onPage={list.setPage} onLimit={list.setLimit} />
      </div>

      {openId && <ListingPreviewModal kind="property" id={openId} onClose={() => setOpen(null)} />}
      {rejecting && (
        <ConfirmDialog
          title={`Reject “${rejecting.name || 'this listing'}”?`}
          message="The listing goes back to draft. The owner sees your reason and can resubmit after making changes."
          confirmLabel="Reject listing"
          reasonLabel="Reason for the owner"
          reasonRequired
          pending={reject.isPending}
          onConfirm={(reason) => reject.mutate({ id: rejecting._id, reason })}
          onClose={() => setRejecting(null)}
        />
      )}
    </div>
  );
}
