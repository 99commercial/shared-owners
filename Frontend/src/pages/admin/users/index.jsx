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
import { accountStatus, formatDate, timeAgo } from '../../../utils/format';

export default function AdminUsersPage() {
  const list = useListParams({ filters: ['isActive', 'ip'] });
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin', 'users', list.query],
    queryFn: () => adminApi.getUsers(list.query).then((r) => r.data.data),
    placeholderData: keepPreviousData,
  });

  const columns = [
    {
      key: 'user',
      label: 'User',
      render: (u) => <div className="max-w-[260px]"><AccountCell account={u} to={`/admin/users/${u._id}`} /></div>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (u) => {
        const s = accountStatus(u);
        return <span className={`badge ${s.className}`}>{s.label}</span>;
      },
    },
    {
      key: 'properties',
      label: 'Properties',
      render: (u) => (
        <Link to={`/admin/users/${u._id}?tab=properties`} className="font-semibold text-ink hover:text-brand-700">{u.propertyCount}</Link>
      ),
    },
    {
      key: 'lastLogin',
      label: 'Last login',
      render: (u) => (
        <div className="text-xs">
          <div className="text-ink">{u.lastLogin?.at ? timeAgo(u.lastLogin.at) : 'Never'}</div>
          {u.lastLogin?.ip && (
            <button type="button" onClick={() => list.setFilter('ip', u.lastLogin.ip)} title="Find every account that used this IP" className="font-mono text-gray-500 hover:text-brand-700">
              {u.lastLogin.ip}
            </button>
          )}
        </div>
      ),
    },
    { key: 'lastActive', label: 'Last active', render: (u) => <span className="text-xs text-gray-600">{timeAgo(u.lastActiveAt)}</span> },
    { key: 'joined', label: 'Joined', render: (u) => <span className="text-xs text-gray-600 whitespace-nowrap">{formatDate(u.createdAt)}</span> },
    {
      key: 'actions',
      label: '',
      headClassName: 'text-right',
      render: (u) => (
        <AccountActions
          compact
          account={u}
          viewTo={`/admin/users/${u._id}`}
          onImpersonate={() => adminApi.impersonateUser(u._id)}
          onSetActive={(isActive) => adminApi.updateUser(u._id, { isActive })}
          onDelete={() => adminApi.deleteUser(u._id)}
          deleteMessage="The account is removed permanently and signed out everywhere. Its listings are hidden from the platform."
        />
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHero
        label="Management"
        title="Individual users"
        subtitle="People who registered to list or find shared-ownership homes"
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Users' }]}
        action={<Link to="/admin/analytics/accounts" className="btn-brand-outline bg-white"><BarChart3 className="w-4 h-4" /> Analytics</Link>}
      />
      <div className="dash-card overflow-hidden">
        <div className="p-4 border-b border-gray-100 space-y-3">
          <ListToolbar
            search={list.search}
            onSearch={list.setSearch}
            placeholder="Search by name, email or last IP…"
            filters={[{ key: 'isActive', value: list.filters.isActive, onChange: (v) => list.setFilter('isActive', v), options: ACCOUNT_STATUS_FILTERS, placeholder: 'All statuses' }]}
            hasFilters={list.hasFilters}
            onClear={list.clear}
          />
          {list.filters.ip && (
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 border border-brand-200 px-3 py-1 text-xs text-brand-800">
              <Globe className="w-3.5 h-3.5" /> Accounts that signed in from <span className="font-mono font-semibold">{list.filters.ip}</span>
              <button type="button" onClick={() => list.setFilter('ip', '')} className="font-semibold hover:underline">Remove</button>
            </div>
          )}
        </div>
        <DataTable columns={columns} rows={data?.items} loading={isLoading} fetching={isFetching} empty="No users match these filters" />
        <Pagination pagination={data?.pagination} page={list.page} limit={list.limit} onPage={list.setPage} onLimit={list.setLimit} />
      </div>
    </div>
  );
}
