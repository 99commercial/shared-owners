import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  Plus, Loader2, Search, ChevronLeft, ChevronRight, Trash2, X, CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageHero from '../../components/PageHero';
import Modal from '../../components/Modal';
import Dropdown from '../../components/Dropdown';
import { MEMBER_STATUS_QUERY } from '../../data/orgMembers';

const PAGE_SIZES = [10, 25, 50];
const COLUMNS = ['Member', 'Job Title', 'Phone', 'Status', 'Last Active', 'Joined', 'Actions'];

const memberStatus = (m) => {
  if (!m.isVerified) return { label: 'Pending approval', className: 'bg-amber-100 text-amber-700' };
  if (!m.isActive) return { label: 'Deactivated', className: 'bg-gray-100 text-gray-500' };
  return { label: 'Active', className: 'bg-green-100 text-green-700' };
};

const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

function RemoveDialog({ type, member, onClose }) {
  const qc = useQueryClient();
  const p = member[type.profileKey] || {};
  const remove = useMutation({
    mutationFn: () => type.remove(member._id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: type.queryKey });
      qc.invalidateQueries({ queryKey: type.dashboardKey });
      toast.success(`${type.singular} removed`);
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not remove'),
  });

  return (
    <Modal title={`Remove ${type.singular.toLowerCase()}?`} onClose={onClose}>
      <p className="text-sm text-gray-600">
        <span className="font-semibold text-ink">{p.firstName ? `${p.firstName} ${p.lastName || ''}` : member.email}</span> will be signed
        out and lose access to your organisation. Listings they created stay with your organisation.
      </p>
      <div className="flex justify-end gap-3 mt-6">
        <button type="button" onClick={onClose} className="btn-brand-outline">Cancel</button>
        <button
          type="button"
          onClick={() => remove.mutate()}
          disabled={remove.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wide disabled:opacity-60"
        >
          {remove.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          Remove
        </button>
      </div>
    </Modal>
  );
}

/** `type` comes from ORG_MEMBER_TYPES */
export default function MembersTable({ type }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(PAGE_SIZES[0]);
  const [removing, setRemoving] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => { setDebounced(search.trim()); setPage(1); }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const query = { page, limit, ...(debounced && { search: debounced }), ...MEMBER_STATUS_QUERY[status] };
  const { data, isLoading, isFetching } = useQuery({
    queryKey: [...type.queryKey, query],
    queryFn: () => type.list(query).then((r) => r.data.data),
    placeholderData: keepPreviousData,
  });

  const approve = useMutation({
    mutationFn: (id) => type.approve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: type.queryKey });
      toast.success(`${type.singular} approved. They can sign in now.`);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not approve'),
  });

  const items = data?.items || [];
  const total = data?.pagination?.total ?? 0;
  const totalPages = data?.pagination?.totalPages ?? 1;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const hasFilters = Boolean(status || debounced);
  const Icon = type.icon;

  return (
    <>
      <PageHero
        label="Team"
        title={type.title}
        subtitle={type.subtitle}
        breadcrumbs={[{ label: 'Home', to: type.homePath }, { label: 'Team' }, { label: type.plural }]}
        action={
          <Link to={`${type.path}/new`} className="btn-brand">
            <Plus className="w-4 h-4" /> Add {type.singular}
          </Link>
        }
      />

      <div className="dash-card p-4 mb-5">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 has-icon">
            <Search className="w-4 h-4 text-brand-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${type.plural.toLowerCase()} by name or email...`}
              className="dash-input"
            />
          </div>
          <Dropdown
            aria-label="Status"
            value={status}
            onChange={(v) => { setStatus(v); setPage(1); }}
            placeholder="All statuses"
            options={type.statuses}
            className="md:w-52"
          />
          {hasFilters && (
            <button type="button" onClick={() => { setSearch(''); setStatus(''); setPage(1); }} className="btn-brand-outline shrink-0">
              <X className="w-4 h-4" /> Clear
            </button>
          )}
        </div>
      </div>

      <div className="dash-card overflow-hidden">
        <div className={`overflow-x-auto ${isFetching && !isLoading ? 'opacity-60' : ''}`}>
          <table className="w-full text-sm min-w-[880px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/60">
                {COLUMNS.map((col) => (
                  <th key={col} className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-600 whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={COLUMNS.length} className="py-16 text-center"><Loader2 className="w-7 h-7 animate-spin text-brand-600 mx-auto" /></td></tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length} className="py-16 text-center">
                    <Icon className="w-9 h-9 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">{hasFilters ? `No ${type.plural.toLowerCase()} match your filters` : `No ${type.plural.toLowerCase()} yet`}</p>
                    {!hasFilters && (
                      <Link to={`${type.path}/new`} className="btn-brand mt-4"><Plus className="w-4 h-4" /> Add your first {type.singular.toLowerCase()}</Link>
                    )}
                  </td>
                </tr>
              ) : (
                items.map((m) => {
                  const p = m[type.profileKey] || {};
                  const s = memberStatus(m);
                  const name = p.firstName ? `${p.firstName} ${p.lastName || ''}`.trim() : m.email.split('@')[0];
                  return (
                    <tr key={m._id} className="hover:bg-brand-50/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 overflow-hidden flex items-center justify-center text-xs font-bold shrink-0">
                            {p.avatarUrl ? <img src={p.avatarUrl} alt="" className="w-full h-full object-cover" /> : name[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-ink truncate max-w-[220px]">{name}</div>
                            <div className="text-xs text-gray-500 truncate max-w-[220px]">{m.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{p.jobTitle || '—'}</td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{p.phone || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${s.className}`}>{s.label}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(m.lastActiveAt)}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(m.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {type.approve && !m.isVerified && (
                            <button
                              type="button"
                              onClick={() => approve.mutate(m._id)}
                              disabled={approve.isPending}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-100 text-green-700 text-xs font-semibold hover:bg-green-200"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Approve
                            </button>
                          )}
                          {type.remove && (
                            <button type="button" onClick={() => setRemoving(m)} title="Remove" className="p-2 rounded-lg text-red-500 hover:bg-red-50">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-2 px-4 py-3 border-t border-gray-100 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            Rows per page:
            <Dropdown
              variant="inline"
              aria-label="Rows per page"
              value={String(limit)}
              onChange={(v) => { setLimit(Number(v)); setPage(1); }}
              options={PAGE_SIZES.map(String)}
            />
          </div>
          <span>{from}–{to} of {total}</span>
          <div className="flex items-center gap-1">
            <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent" aria-label="Previous page">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent" aria-label="Next page">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {removing && <RemoveDialog type={type} member={removing} onClose={() => setRemoving(null)} />}
    </>
  );
}
