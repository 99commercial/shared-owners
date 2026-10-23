import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, HomeIcon, LayoutDashboard, Pencil, Phone, Eye, MessageSquare, CheckCircle2, AlertTriangle } from 'lucide-react';
import { adminApi } from '../../../services/endpoints';
import useTab from '../../../hooks/useTab';
import PageHero from '../../../components/PageHero';
import Panel from '../../../components/admin/Panel';
import KpiCard from '../../../components/admin/KpiCard';
import InfoTile from '../../../components/admin/InfoTile';
import AccountActions from '../../../components/admin/AccountActions';
import SessionsPanel, { LoginIpsPanel } from '../../../components/admin/SessionsPanel';
import { SplitBar } from '../../../components/admin/Charts';
import { PageError, PageLoader } from '../../../components/admin/QueryState';
import AccountSummaryCard from '../../../sections/admin/accounts/AccountSummaryCard';
import EditAccountModal from '../../../sections/admin/accounts/EditAccountModal';
import PropertiesTable from '../../../sections/admin/listings/PropertiesTable';
import { STATUS_COLORS } from '../../../data/adminOptions';
import { PROPERTY_STATUS_VALUES, labelize } from '../../../data/propertyOptions';
import { accountName, formatNumber, profileOf } from '../../../utils/format';

const TABS = ['overview', 'properties', 'activity'];

export default function AdminUserDetailPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useTab(TABS);
  const [editing, setEditing] = useState(false);
  const queryKey = ['admin', 'user', userId];

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => adminApi.getUser(userId).then((r) => r.data.data),
  });

  const crumbs = [{ label: 'Admin', to: '/admin' }, { label: 'Users', to: '/admin/users' }];
  if (isLoading) return <div className="p-4 sm:p-6 lg:p-8"><PageHero title="User" breadcrumbs={crumbs} /><PageLoader /></div>;
  if (error) return <div className="p-4 sm:p-6 lg:p-8"><PageHero title="User" breadcrumbs={crumbs} /><PageError error={error} backTo="/admin/users" backLabel="Back to users" /></div>;

  const { user, sessions, loginIps, properties } = data;
  const t = properties.totals;
  const name = accountName(user);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <PageHero
        label="Individual user"
        title={name}
        subtitle={user.email}
        breadcrumbs={[...crumbs, { label: name }]}
        tabs={[
          { key: 'overview', label: 'Overview', icon: LayoutDashboard },
          { key: 'properties', label: `Properties (${t.properties})`, icon: HomeIcon },
          { key: 'activity', label: 'Activity', icon: Activity },
        ]}
        activeTab={tab}
        onTabChange={setTab}
      />

      <AccountSummaryCard
        account={user}
        sessions={sessions}
        actions={
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:border-brand-300 hover:text-brand-700">
              <Pencil className="w-4 h-4" /> Edit profile
            </button>
            <AccountActions
              account={user}
              onImpersonate={() => adminApi.impersonateUser(userId)}
              onSetActive={(isActive) => adminApi.updateUser(userId, { isActive })}
              onDelete={() => adminApi.deleteUser(userId)}
              deleteMessage="The account is removed permanently and signed out everywhere. Its listings are hidden from the platform."
              onDeleted={() => navigate('/admin/users', { replace: true })}
            />
          </div>
        }
      >
        <InfoTile icon={Phone} label="Phone" value={profileOf(user).phone} />
      </AccountSummaryCard>

      {tab === 'overview' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard icon={HomeIcon} label="Properties" value={formatNumber(t.properties)} hint={`${t.premium} premium`} />
            <KpiCard icon={CheckCircle2} tone="green" label="Live" value={formatNumber(properties.byStatus.live)} hint={`${properties.byStatus.pending_approval} awaiting approval`} />
            <KpiCard icon={Eye} tone="cyan" label="Views" value={formatNumber(t.views)} hint={`${t.enquiryRate}% enquiry rate`} />
            <KpiCard icon={MessageSquare} tone="violet" label="Enquiries" value={formatNumber(t.enquiries)} hint={`${t.incomplete} incomplete listings`} />
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <Panel title="Listings by status" icon={HomeIcon}>
              <SplitBar items={PROPERTY_STATUS_VALUES.map((s) => ({ label: labelize(s), value: properties.byStatus[s] || 0, color: STATUS_COLORS[s] }))} />
              {t.incomplete > 0 && (
                <p className="mt-5 text-sm text-amber-700 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{t.incomplete} listing{t.incomplete === 1 ? ' is' : 's are'} missing required sections.</p>
              )}
            </Panel>
            <LoginIpsPanel loginIps={loginIps} />
          </div>
        </>
      )}

      {tab === 'properties' && (
        <PropertiesTable prefix="properties." fixed={{ owner: userId, ownerType: 'user' }} hide={['owner', 'ownerType', 'createdBy']} emptyText="This user has no listings" />
      )}

      {tab === 'activity' && (
        <SessionsPanel
          queryKey={queryKey}
          list={(params) => adminApi.getUserSessions(userId, params)}
          listActivities={(sessionId, params) => adminApi.getUserSessionActivities(userId, sessionId, params)}
        />
      )}

      {editing && (
        <EditAccountModal
          account={user}
          save={(body) => adminApi.updateUser(userId, body)}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ['admin'] })}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}
