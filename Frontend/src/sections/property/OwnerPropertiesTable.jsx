import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  Plus, HomeIcon, Loader2, Search, ChevronLeft, ChevronRight, ArrowDown, ArrowUp, Pencil, Trash2, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageHero from '../../components/PageHero';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import Dropdown from '../../components/Dropdown';
import { PROPERTY_STATUS_VALUES, PROPERTY_SECTIONS, labelize } from '../../data/propertyOptions';

const REQUIRED_COUNT = PROPERTY_SECTIONS.filter((s) => s.required).length;
const PAGE_SIZES = [10, 25, 50];
const STATUS_OPTIONS = PROPERTY_STATUS_VALUES.map((s) => ({ value: s, label: labelize(s) }));
const BASE_COLUMNS = ['Image', 'Property Name', 'Type', 'Location', 'Size', 'Status', 'Created Date', 'Actions'];

const sizeLabel = (bedrooms) => {
  if (bedrooms === undefined || bedrooms === null) return '—';
  return bedrooms === 0 ? 'Studio' : `${bedrooms} bed`;
};

function DeleteDialog({ owner, property, onClose }) {
  const qc = useQueryClient();
  const remove = useMutation({
    mutationFn: () => owner.api.deleteProperty(property._id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: owner.keys.list });
      qc.invalidateQueries({ queryKey: owner.keys.dashboard });
      qc.invalidateQueries({ queryKey: owner.keys.profile });
      toast.success('Property deleted');
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not delete property'),
  });

  return (
    <Modal title="Delete property?" onClose={onClose}>
      <p className="text-sm text-gray-600">
        <span className="font-semibold text-ink">{property.name}</span> will be removed from your listings and hidden from
        buyers. This cannot be undone.
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
          Delete
        </button>
      </div>
    </Modal>
  );
}

/** `owner` comes from PROPERTY_OWNERS */
export default function OwnerPropertiesTable({ owner }) {
  const { api, basePath, keys, listTitle } = owner;
  const columns = owner.canDelete ? [...BASE_COLUMNS, 'Delete'] : BASE_COLUMNS;
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || '';
  const page = Number(params.get('page')) || 1;
  const limit = PAGE_SIZES.includes(Number(params.get('limit'))) ? Number(params.get('limit')) : PAGE_SIZES[0];
  const sort = params.get('sort') === 'createdAt' ? 'createdAt' : '-createdAt';
  const searchParam = params.get('search') || '';
  const [search, setSearch] = useState(searchParam);
  const [deleting, setDeleting] = useState(null);

  const updateParams = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== (params.get('search') || '')) updateParams({ search, page: '' });
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const query = { page, limit, sort, ...(status && { status }), ...(searchParam && { search: searchParam }) };
  const { data, isLoading, isFetching } = useQuery({
    queryKey: [...keys.list, query],
    queryFn: () => api.getProperties(query).then((r) => r.data.data),
    placeholderData: keepPreviousData,
  });

  const items = data?.items || [];
  const total = data?.pagination?.total ?? 0;
  const totalPages = data?.pagination?.totalPages ?? 1;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const hasFilters = Boolean(status || searchParam);

  return (
    <>
      <PageHero
        label="Property"
        title={listTitle}
        breadcrumbs={[{ label: 'Home', to: basePath }, { label: 'Property', to: `${basePath}/properties` }, { label: listTitle }]}
        action={
          <Link to={`${basePath}/properties/new`} className="btn-brand">
            <Plus className="w-4 h-4" /> Create Property
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
              placeholder="Search properties by name, reference or postcode..."
              className="dash-input"
            />
          </div>
          <Dropdown
            aria-label="Status"
            value={status}
            onChange={(v) => updateParams({ status: v, page: '' })}
            placeholder="All statuses"
            options={STATUS_OPTIONS}
            className="md:w-52"
          />
          {hasFilters && (
            <button
              type="button"
              onClick={() => { setSearch(''); updateParams({ search: '', status: '', page: '' }); }}
              className="btn-brand-outline shrink-0"
            >
              <X className="w-4 h-4" /> Clear
            </button>
          )}
        </div>
      </div>

      <div className="dash-card overflow-hidden">
        <div className={`overflow-x-auto ${isFetching && !isLoading ? 'opacity-60' : ''}`}>
          <table className="w-full text-sm min-w-[960px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/60">
                {columns.map((col) => (
                  <th key={col} className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-600 whitespace-nowrap">
                    {col === 'Created Date' ? (
                      <button
                        type="button"
                        onClick={() => updateParams({ sort: sort === '-createdAt' ? 'createdAt' : '', page: '' })}
                        className="inline-flex items-center gap-1 uppercase hover:text-ink"
                      >
                        {col}
                        {sort === '-createdAt' ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowUp className="w-3.5 h-3.5" />}
                      </button>
                    ) : col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={columns.length} className="py-16 text-center"><Loader2 className="w-7 h-7 animate-spin text-brand-600 mx-auto" /></td></tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="py-16 text-center">
                    <p className="text-gray-500">No properties found</p>
                    {!hasFilters && (
                      <Link to={`${basePath}/properties/new`} className="btn-brand mt-4"><Plus className="w-4 h-4" /> Create your first property</Link>
                    )}
                  </td>
                </tr>
              ) : (
                items.map((p) => {
                  const done = REQUIRED_COUNT - (p.completion?.missingSections?.length ?? REQUIRED_COUNT);
                  const img = p.searchSnapshot?.primaryImageUrl;
                  return (
                    <tr key={p._id} className="hover:bg-brand-50/40">
                      <td className="px-4 py-3">
                        <div className="w-14 h-11 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
                          {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <HomeIcon className="w-5 h-5 text-gray-300" />}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`${basePath}/properties/${p._id}`} className="font-semibold text-ink hover:text-brand-700 line-clamp-1 max-w-[220px]">{p.name}</Link>
                        {p.reference && <div className="text-xs text-gray-400">Ref {p.reference}</div>}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        <div>{p.searchSnapshot?.propertyType ? labelize(p.searchSnapshot.propertyType) : '—'}</div>
                        {p.searchSnapshot?.schemeType && <div className="text-xs text-gray-400">{labelize(p.searchSnapshot.schemeType)}</div>}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        <div>{p.address?.townCity || '—'}</div>
                        {p.address?.postcode && <div className="text-xs text-gray-400">{p.address.postcode}</div>}
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{sizeLabel(p.searchSnapshot?.bedrooms)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={p.status} />
                        <div className="text-[11px] text-gray-400 mt-1 whitespace-nowrap">
                          {p.approval?.decision === 'rejected' && p.status === 'draft' ? <span className="text-red-600">Rejected</span> : `${done}/${REQUIRED_COUNT} steps`}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`${basePath}/properties/${p._id}`} title="Edit" className="inline-flex p-2 rounded-lg text-gray-500 hover:bg-brand-100 hover:text-ink">
                          <Pencil className="w-4 h-4" />
                        </Link>
                      </td>
                      {owner.canDelete && (
                        <td className="px-4 py-3">
                          <button type="button" onClick={() => setDeleting(p)} title="Delete" className="p-2 rounded-lg text-red-500 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
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
              onChange={(v) => updateParams({ limit: v === '10' ? '' : v, page: '' })}
              options={PAGE_SIZES.map(String)}
            />
          </div>
          <span>{from}–{to} of {total}</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => updateParams({ page: page - 1 > 1 ? String(page - 1) : '' })}
              className="p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => updateParams({ page: String(page + 1) })}
              className="p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
              aria-label="Next page"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {deleting && <DeleteDialog owner={owner} property={deleting} onClose={() => setDeleting(null)} />}
    </>
  );
}
