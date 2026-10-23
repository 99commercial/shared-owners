import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { adminApi } from '../../../services/endpoints';
import useListParams from '../../../hooks/useListParams';
import { DataTable, Pagination } from '../../../components/admin/DataTable';
import ListToolbar from '../../../components/admin/ListToolbar';
import AccountCell from '../../../components/admin/AccountCell';
import AccountActions from '../../../components/admin/AccountActions';
import { ACCOUNT_STATUS_FILTERS, MEMBER_TYPES } from '../../../data/adminOptions';
import { accountStatus, formatDate, timeAgo } from '../../../utils/format';

const VERIFIED_FILTERS = {
  admins: [
    { value: 'true', label: 'Email verified' },
    { value: 'false', label: 'Email not verified' },
  ],
  users: [
    { value: 'true', label: 'Approved' },
    { value: 'false', label: 'Awaiting approval' },
  ],
};

/** A company's admins or users (`memberType`) with open-account / deactivate / delete */
export default function CompanyMembersTable({ companyId, memberType }) {
  const type = MEMBER_TYPES[memberType];
  const list = useListParams({ filters: ['isActive', 'isVerified'], prefix: `${memberType}.` });
  const memberPath = (m) => `/admin/companies/${companyId}/${memberType}/${m._id}`;

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin', 'company', companyId, memberType, list.query],
    queryFn: () => adminApi.getCompanyMembers(companyId, memberType, list.query).then((r) => r.data.data),
    placeholderData: keepPreviousData,
  });

  const columns = [
    {
      key: 'member',
      label: type.singular,
      render: (m) => <div className="max-w-[260px]"><AccountCell account={m} to={memberPath(m)} /></div>,
    },
    { key: 'jobTitle', label: 'Job title', render: (m) => <span className="text-sm text-gray-600">{m[type.profileKey]?.jobTitle || '—'}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (m) => {
        const s = accountStatus(m);
        return <span className={`badge ${s.className}`}>{s.label}</span>;
      },
    },
    {
      key: 'lastLogin',
      label: 'Last login',
      render: (m) => (
        <div className="text-xs">
          <div className="text-ink">{m.lastLogin?.at ? timeAgo(m.lastLogin.at) : 'Never'}</div>
          {m.lastLogin?.ip && <div className="font-mono text-gray-500">{m.lastLogin.ip}</div>}
        </div>
      ),
    },
    { key: 'lastActive', label: 'Last active', render: (m) => <span className="text-xs text-gray-600">{timeAgo(m.lastActiveAt)}</span> },
    { key: 'joined', label: 'Added', render: (m) => <span className="text-xs text-gray-600 whitespace-nowrap">{formatDate(m.createdAt)}</span> },
    {
      key: 'actions',
      label: '',
      headClassName: 'text-right',
      render: (m) => (
        <AccountActions
          compact
          account={m}
          viewTo={memberPath(m)}
          onImpersonate={() => adminApi.impersonateCompanyMember(companyId, memberType, m._id)}
          onSetActive={(isActive) => adminApi.updateCompanyMember(companyId, memberType, m._id, { isActive })}
          onDelete={(reason) => adminApi.deleteCompanyMember(companyId, memberType, m._id, reason ? { reason } : {})}
          askDeleteReason
          deleteMessage={`The ${type.singular.toLowerCase()} is removed and signed out. Listings they created stay with the organisation. They and the organisation are emailed, with your reason if you give one.`}
        />
      ),
    },
  ];

  return (
    <div className="dash-card overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <ListToolbar
          search={list.search}
          onSearch={list.setSearch}
          placeholder={`Search ${type.plural.toLowerCase()} by name or email…`}
          filters={[
            { key: 'isActive', value: list.filters.isActive, onChange: (v) => list.setFilter('isActive', v), options: ACCOUNT_STATUS_FILTERS, placeholder: 'Active & deactivated' },
            { key: 'isVerified', value: list.filters.isVerified, onChange: (v) => list.setFilter('isVerified', v), options: VERIFIED_FILTERS[memberType], placeholder: memberType === 'users' ? 'Any approval' : 'Any verification', className: 'md:w-52' },
          ]}
          hasFilters={list.hasFilters}
          onClear={list.clear}
        />
      </div>
      <DataTable columns={columns} rows={data?.items} loading={isLoading} fetching={isFetching} empty={`No ${type.plural.toLowerCase()} match these filters`} />
      <Pagination pagination={data?.pagination} page={list.page} limit={list.limit} onPage={list.setPage} onLimit={list.setLimit} />
    </div>
  );
}
