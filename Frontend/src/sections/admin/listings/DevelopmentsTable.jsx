import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Eye, HomeIcon, Landmark, Trash2, Crown } from 'lucide-react';
import { adminApi } from '../../../services/endpoints';
import useListParams from '../../../hooks/useListParams';
import { DataTable, Pagination } from '../../../components/admin/DataTable';
import ListToolbar from '../../../components/admin/ListToolbar';
import AccountCell from '../../../components/admin/AccountCell';
import ConfirmDialog from '../../../components/admin/ConfirmDialog';
import ListingPreviewModal from './ListingPreviewModal';
import { DEVELOPMENT_STATUS_VALUES } from '../../../data/developmentOptions';
import { STATUS_STYLES, labelize } from '../../../data/propertyOptions';
import { timeAgo } from '../../../utils/format';
import { adminAccountPath } from '../../../utils/adminPaths';

const STATUS_OPTIONS = DEVELOPMENT_STATUS_VALUES.map((s) => ({ value: s, label: labelize(s) }));

/** Every development, or one company's (`fixed = { owner }`, hide = ['owner']) */
export default function DevelopmentsTable({ fixed = {}, hide = [], prefix = '', emptyText = 'No developments match these filters' }) {
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [toDelete, setToDelete] = useState(null);
  const list = useListParams({ filters: ['status'], prefix });
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
    queryKey: ['admin', 'developments', query],
    queryFn: () => adminApi.getDevelopments(query).then((r) => r.data.data),
    placeholderData: keepPreviousData,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteDevelopment(id),
    onSuccess: () => {
      toast.success('Development deleted');
      setToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not delete the development'),
  });

  const columns = [
    {
      key: 'development',
      label: 'Development',
      render: (d) => (
        <button type="button" onClick={() => setOpen(d._id)} className="flex items-center gap-3 text-left group min-w-0">
          {d.searchSnapshot?.primaryImageUrl ? (
            <img src={d.searchSnapshot.primaryImageUrl} alt="" className="w-14 h-11 rounded-lg object-cover shrink-0 bg-gray-100" />
          ) : (
            <div className="w-14 h-11 rounded-lg bg-amber-50 text-amber-400 flex items-center justify-center shrink-0"><Landmark className="w-5 h-5" /></div>
          )}
          <div className="min-w-0">
            <div className="font-semibold text-ink truncate max-w-[260px] group-hover:text-brand-700 flex items-center gap-1">
              {d.isPremium && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
              {d.name}
            </div>
            <div className="text-xs text-gray-500 truncate max-w-[260px]">
              {[labelize(d.developmentType), d.address?.townCity, d.address?.postcode].filter(Boolean).join(' · ') || '—'}
            </div>
          </div>
        </button>
      ),
    },
    !hide.includes('owner') && {
      key: 'owner',
      label: 'Organisation',
      render: (d) => (d.owner ? (
        <div className="max-w-[220px]"><AccountCell account={d.owner} to={adminAccountPath(d.owner)} /></div>
      ) : <span className="text-gray-400">Removed</span>),
    },
    {
      key: 'createdBy',
      label: 'Created by',
      render: (d) => (d.createdBy && String(d.createdBy._id) !== String(d.owner?._id ?? d.owner) ? (
        <div className="max-w-[180px]"><AccountCell account={d.createdBy} to={adminAccountPath(d.createdBy)} /></div>
      ) : <span className="text-xs text-gray-400">Organisation</span>),
    },
    { key: 'status', label: 'Status', render: (d) => <span className={`badge ${STATUS_STYLES[d.status]}`}>{labelize(d.status)}</span> },
    { key: 'updated', label: 'Updated', render: (d) => <span className="text-xs text-gray-500 whitespace-nowrap">{timeAgo(d.updatedAt)}</span> },
    {
      key: 'actions',
      label: '',
      headClassName: 'text-right',
      render: (d) => (
        <div className="flex justify-end gap-0.5">
          <Link to={`/admin/properties?development=${d._id}`} title="Homes in this development" className="p-2 rounded-lg text-gray-500 hover:bg-green-50 hover:text-green-700"><HomeIcon className="w-4 h-4" /></Link>
          <button type="button" title="View details" onClick={() => setOpen(d._id)} className="p-2 rounded-lg text-gray-500 hover:bg-brand-50 hover:text-brand-700"><Eye className="w-4 h-4" /></button>
          <button type="button" title="Delete" onClick={() => setToDelete(d)} className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ].filter(Boolean);

  return (
    <div className="dash-card overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <ListToolbar
          search={list.search}
          onSearch={list.setSearch}
          placeholder="Search by name or postcode…"
          filters={[{ key: 'status', value: list.filters.status, onChange: (v) => list.setFilter('status', v), options: STATUS_OPTIONS, placeholder: 'All statuses' }]}
          hasFilters={list.hasFilters}
          onClear={list.clear}
        />
      </div>
      <DataTable columns={columns} rows={data?.items} loading={isLoading} fetching={isFetching} empty={emptyText} minWidth={hide.length ? 720 : 960} />
      <Pagination pagination={data?.pagination} page={list.page} limit={list.limit} onPage={list.setPage} onLimit={list.setLimit} />

      {openId && <ListingPreviewModal kind="development" id={openId} onClose={() => setOpen(null)} />}
      {toDelete && (
        <ConfirmDialog
          title={`Delete “${toDelete.name}”?`}
          message="The development is removed from the platform. Homes linked to it stay listed but are no longer grouped under it."
          pending={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(toDelete._id)}
          onClose={() => setToDelete(null)}
        />
      )}
    </div>
  );
}
