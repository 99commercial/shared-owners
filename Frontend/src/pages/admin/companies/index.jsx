import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { BarChart3, Globe } from 'lucide-react';
import { adminApi } from '../../../services/endpoints';
import useListParams from '../../../hooks/useListParams';
import PageHero from '../../../components/PageHero';
import { DataTable, Pagination } from '../../../components/admin/DataTable';
import ListToolbar from '../../../components/admin/ListToolbar';
import AccountCell from '../../../components/admin/AccountCell';
import AccountActions from '../../../components/admin/AccountActions';
import { ACCOUNT_STATUS_FILTERS } from '../../../data/adminOptions';
import { ORGANISATION_TYPES } from '../../../data/constants';
import { labelize } from '../../../data/propertyOptions';
import { accountStatus, formatDate, timeAgo } from '../../../utils/format';

const typeLabel = (value) => ORGANISATION_TYPES.find((t) => t.value === value)?.label || labelize(value) || '—';

export default function AdminCompaniesPage() {
  const list = useListParams({ filters: ['isActive', 'ip'] });
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin', 'companies', list.query],
    queryFn: () => adminApi.getCompanies(list.query).then((r) => r.data.data),
    placeholderData: keepPreviousData,
  });

  const columns = [
    {
      key: 'company',
      label: 'Organisation',
      render: (c) => <div className="max-w-[260px]"><AccountCell account={c} to={`/admin/companies/${c._id}`} /></div>,
    },
    { key: 'type', label: 'Type', render: (c) => <span className="text-xs text-gray-600">{typeLabel(c.organisationProfile?.type)}</span> },
    {
      key: 'members',
      label: 'Admins / users',
      render: (c) => (
        <div className="flex items-center gap-1.5 text-sm">
          <Link to={`/admin/companies/${c._id}?tab=admins`} className="font-semibold text-ink hover:text-brand-700">{c.members.admins}</Link>
          <span className="text-gray-300">/</span>
          <Link to={`/admin/companies/${c._id}?tab=users`} className="font-semibold text-ink hover:text-brand-700">{c.members.users}</Link>
        </div>
      ),
    },
    {
      key: 'listings',
      label: 'Properties / developments',
      render: (c) => (
        <div className="flex items-center gap-1.5 text-sm">
          <Link to={`/admin/companies/${c._id}?tab=properties`} className="font-semibold text-ink hover:text-brand-700">{c.propertyCount}</Link>
          <span className="text-gray-300">/</span>
          <Link to={`/admin/companies/${c._id}?tab=developments`} className="font-semibold text-ink hover:text-brand-700">{c.developmentCount}</Link>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (c) => {
        const s = accountStatus(c);
        return <span className={`badge ${s.className}`}>{s.label}</span>;
      },
    },
    { key: 'lastActive', label: 'Last active', render: (c) => <span className="text-xs text-gray-600">{timeAgo(c.lastActiveAt)}</span> },
    { key: 'joined', label: 'Joined', render: (c) => <span className="text-xs text-gray-600 whitespace-nowrap">{formatDate(c.createdAt)}</span> },
    {
      key: 'actions',
      label: '',
      headClassName: 'text-right',
      render: (c) => (
        <AccountActions
          compact
          account={c}
          viewTo={`/admin/companies/${c._id}`}
          onImpersonate={() => adminApi.impersonateCompany(c._id)}
          onSetActive={(isActive) => adminApi.updateCompany(c._id, { isActive })}
          onDelete={() => adminApi.deleteCompany(c._id)}
          deactivateMessage="The organisation and all of its admins and users are signed out and cannot sign in until it is reactivated."
          deleteMessage={`This permanently removes the organisation, its ${c.members.admins} admin(s) and ${c.members.users} user(s), and hides its ${c.propertyCount} properties and ${c.developmentCount} developments.`}
        />
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHero
        label="Management"
        title="Organisations"
        subtitle="Housing associations, developers, landlords and agents, with their teams"
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Organisations' }]}
        action={<Link to="/admin/analytics/accounts" className="btn-brand-outline bg-white"><BarChart3 className="w-4 h-4" /> Analytics</Link>}
      />
      <div className="dash-card overflow-hidden">
        <div className="p-4 border-b border-gray-100 space-y-3">
          <ListToolbar
            search={list.search}
            onSearch={list.setSearch}
            placeholder="Search by name, email, slug or last IP…"
            filters={[{ key: 'isActive', value: list.filters.isActive, onChange: (v) => list.setFilter('isActive', v), options: ACCOUNT_STATUS_FILTERS, placeholder: 'All statuses' }]}
            hasFilters={list.hasFilters}
            onClear={list.clear}
          />
          {list.filters.ip && (
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 border border-brand-200 px-3 py-1 text-xs text-brand-800">
              <Globe className="w-3.5 h-3.5" /> Organisations whose accounts signed in from <span className="font-mono font-semibold">{list.filters.ip}</span>
              <button type="button" onClick={() => list.setFilter('ip', '')} className="font-semibold hover:underline">Remove</button>
            </div>
          )}
        </div>
        <DataTable columns={columns} rows={data?.items} loading={isLoading} fetching={isFetching} empty="No organisations match these filters" minWidth={1000} />
        <Pagination pagination={data?.pagination} page={list.page} limit={list.limit} onPage={list.setPage} onLimit={list.setLimit} />
      </div>
    </div>
  );
}
