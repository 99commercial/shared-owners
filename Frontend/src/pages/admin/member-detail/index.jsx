import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, Briefcase, Building2, HomeIcon, LayoutDashboard, Pencil, Phone, UserCog } from 'lucide-react';
import { adminApi } from '../../../services/endpoints';
import useTab from '../../../hooks/useTab';
import PageHero from '../../../components/PageHero';
import KpiCard from '../../../components/admin/KpiCard';
import InfoTile from '../../../components/admin/InfoTile';
import AccountActions from '../../../components/admin/AccountActions';
import SessionsPanel, { LoginIpsPanel } from '../../../components/admin/SessionsPanel';
import { PageError, PageLoader } from '../../../components/admin/QueryState';
import AccountSummaryCard from '../../../sections/admin/accounts/AccountSummaryCard';
import EditAccountModal from '../../../sections/admin/accounts/EditAccountModal';
import PropertiesTable from '../../../sections/admin/listings/PropertiesTable';
import { MEMBER_TYPES } from '../../../data/adminOptions';
import { accountName, formatNumber, timeAgo } from '../../../utils/format';

const TABS = ['overview', 'properties', 'activity'];

export default function AdminMemberDetailPage() {
  const { companyId, memberType, memberId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useTab(TABS);
  const [editing, setEditing] = useState(false);
  const type = MEMBER_TYPES[memberType];
  const queryKey = ['admin', 'company', companyId, memberType, 'member', memberId];

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => adminApi.getCompanyMember(companyId, memberType, memberId).then((r) => r.data.data),
    enabled: Boolean(type),
  });
  const { data: companyData } = useQuery({
    queryKey: ['admin', 'company', companyId],
    queryFn: () => adminApi.getCompany(companyId).then((r) => r.data.data),
    enabled: Boolean(type),
  });

  if (!type) return <Navigate to={`/admin/companies/${companyId}`} replace />;

  const companyName = companyData ? accountName(companyData.company) : 'Organisation';
  const companyPath = `/admin/companies/${companyId}`;
  const crumbs = [
    { label: 'Admin', to: '/admin' },
    { label: 'Organisations', to: '/admin/companies' },
    { label: companyName, to: companyPath },
    { label: type.plural, to: `${companyPath}?tab=${memberType}` },
  ];

  if (isLoading) return <div className="p-4 sm:p-6 lg:p-8"><PageHero title={type.singular} breadcrumbs={crumbs} /><PageLoader /></div>;
  if (error) return <div className="p-4 sm:p-6 lg:p-8"><PageHero title={type.singular} breadcrumbs={crumbs} /><PageError error={error} backTo={`${companyPath}?tab=${memberType}`} backLabel={`Back to ${type.plural.toLowerCase()}`} /></div>;

  const { member, stats, loginIps } = data;
  const profile = member[type.profileKey] || {};
  const name = accountName(member);
  const api = {
    impersonate: () => adminApi.impersonateCompanyMember(companyId, memberType, memberId),
    update: (body) => adminApi.updateCompanyMember(companyId, memberType, memberId, body),
    remove: (reason) => adminApi.deleteCompanyMember(companyId, memberType, memberId, reason ? { reason } : {}),
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <PageHero
        label={`Organisation ${type.singular.toLowerCase()}`}
        title={name}
        subtitle={`${member.email} · ${companyName}`}
        breadcrumbs={[...crumbs, { label: name }]}
        tabs={[
          { key: 'overview', label: 'Overview', icon: LayoutDashboard },
          { key: 'properties', label: `Properties created (${stats.propertiesCreated})`, icon: HomeIcon },
          { key: 'activity', label: 'Activity', icon: Activity },
        ]}
        activeTab={tab}
        onTabChange={setTab}
      />

      <AccountSummaryCard
        account={member}
        sessions={{ total: stats.totalSessions, active: stats.activeSessions, lastActiveAt: stats.lastActiveAt }}
        actions={
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:border-brand-300 hover:text-brand-700">
              <Pencil className="w-4 h-4" /> Edit profile
            </button>
            <AccountActions
              account={member}
              onImpersonate={api.impersonate}
              onSetActive={(isActive) => api.update({ isActive })}
              onDelete={api.remove}
              askDeleteReason
              deleteMessage={`The ${type.singular.toLowerCase()} is removed and signed out. Listings they created stay with the organisation. They and the organisation are emailed, with your reason if you give one.`}
              onDeleted={() => navigate(`${companyPath}?tab=${memberType}`, { replace: true })}
            />
          </div>
        }
      >
        <InfoTile icon={Phone} label="Phone" value={profile.phone} />
        <InfoTile icon={Briefcase} label="Job title" value={profile.jobTitle} />
        <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/60 px-3.5 py-3">
          <Building2 className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Organisation</div>
            <Link to={companyPath} className="text-sm font-medium text-brand-700 hover:underline">{companyName}</Link>
          </div>
        </div>
        {memberType === 'users' && profile.assignedBy && (
          <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/60 px-3.5 py-3">
            <UserCog className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Managed by</div>
              <Link to={`${companyPath}/admins/${profile.assignedBy}`} className="text-sm font-medium text-brand-700 hover:underline">View admin</Link>
            </div>
          </div>
        )}
      </AccountSummaryCard>

      {tab === 'overview' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard icon={HomeIcon} label="Properties created" value={formatNumber(stats.propertiesCreated)} hint="Owned by the organisation" />
            <KpiCard icon={Activity} tone="green" label="Signed in now" value={formatNumber(stats.activeSessions)} hint="Active sessions" />
            <KpiCard icon={Activity} tone="cyan" label="Total sessions" value={formatNumber(stats.totalSessions)} hint="Including admin access" />
            <KpiCard icon={Activity} tone="violet" label="Last active" value={timeAgo(stats.lastActiveAt)} hint="Most recent request" />
          </div>
          <LoginIpsPanel loginIps={loginIps} />
        </>
      )}

      {tab === 'properties' && (
        <PropertiesTable
          prefix="properties."
          fixed={{ owner: companyId, createdBy: memberId }}
          hide={['owner', 'ownerType', 'createdBy']}
          emptyText={`This ${type.singular.toLowerCase()} has not created any properties`}
        />
      )}

      {tab === 'activity' && (
        <SessionsPanel
          queryKey={queryKey}
          list={(params) => adminApi.getCompanyMemberSessions(companyId, memberType, memberId, params)}
          listActivities={(sessionId, params) => adminApi.getCompanyMemberSessionActivities(companyId, memberType, memberId, sessionId, params)}
        />
      )}

      {editing && (
        <EditAccountModal
          account={member}
          save={api.update}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ['admin'] })}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}
