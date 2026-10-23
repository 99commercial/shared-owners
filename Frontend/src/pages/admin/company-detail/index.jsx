import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity, Building2, CheckCircle2, Eye, Globe, HomeIcon, Landmark, LayoutDashboard, Mail, MapPin, MessageSquare,
  Pencil, Phone, Tag, UserCheck, Users,
} from 'lucide-react';
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
import CompanyMembersTable from '../../../sections/admin/accounts/CompanyMembersTable';
import PropertiesTable from '../../../sections/admin/listings/PropertiesTable';
import DevelopmentsTable from '../../../sections/admin/listings/DevelopmentsTable';
import { STATUS_COLORS } from '../../../data/adminOptions';
import { ORGANISATION_TYPES } from '../../../data/constants';
import { DEVELOPMENT_STATUS_VALUES } from '../../../data/developmentOptions';
import { PROPERTY_STATUS_VALUES, labelize } from '../../../data/propertyOptions';
import { accountName, formatNumber } from '../../../utils/format';

const TABS = ['overview', 'admins', 'users', 'properties', 'developments', 'activity'];

const statusItems = (byStatus, values) =>
  values.map((s) => ({ label: labelize(s), value: byStatus?.[s] || 0, color: STATUS_COLORS[s] }));

export default function AdminCompanyDetailPage() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useTab(TABS);
  const [editing, setEditing] = useState(false);
  const queryKey = ['admin', 'company', companyId];

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => adminApi.getCompany(companyId).then((r) => r.data.data),
  });

  const crumbs = [{ label: 'Admin', to: '/admin' }, { label: 'Organisations', to: '/admin/companies' }];
  if (isLoading) return <div className="p-4 sm:p-6 lg:p-8"><PageHero title="Organisation" breadcrumbs={crumbs} /><PageLoader /></div>;
  if (error) return <div className="p-4 sm:p-6 lg:p-8"><PageHero title="Organisation" breadcrumbs={crumbs} /><PageError error={error} backTo="/admin/companies" backLabel="Back to organisations" /></div>;

  const { company, members, sessions, loginIps, properties, developments } = data;
  const profile = company.organisationProfile || {};
  const t = properties.totals;
  const name = accountName(company);
  const address = [profile.address?.line1, profile.address?.line2, profile.address?.city, profile.address?.county, profile.address?.postcode]
    .filter(Boolean).join(', ');

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <PageHero
        label="Organisation"
        title={name}
        subtitle={company.email}
        breadcrumbs={[...crumbs, { label: name }]}
        tabs={[
          { key: 'overview', label: 'Overview', icon: LayoutDashboard },
          { key: 'admins', label: `Admins (${members.admins.total})`, icon: UserCheck },
          { key: 'users', label: `Users (${members.users.total})`, icon: Users },
          { key: 'properties', label: `Properties (${t.properties})`, icon: HomeIcon },
          { key: 'developments', label: `Developments (${developments.total})`, icon: Landmark },
          { key: 'activity', label: 'Activity', icon: Activity },
        ]}
        activeTab={tab}
        onTabChange={setTab}
      />

      <AccountSummaryCard
        account={company}
        sessions={sessions}
        actions={
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:border-brand-300 hover:text-brand-700">
              <Pencil className="w-4 h-4" /> Edit profile
            </button>
            <AccountActions
              account={company}
              onImpersonate={() => adminApi.impersonateCompany(companyId)}
              onSetActive={(isActive) => adminApi.updateCompany(companyId, { isActive })}
              onDelete={() => adminApi.deleteCompany(companyId)}
              deactivateMessage="The organisation and all of its admins and users are signed out and cannot sign in until it is reactivated."
              deleteMessage={`This permanently removes ${name}, its ${members.admins.total} admin(s) and ${members.users.total} user(s), and hides its ${t.properties} properties and ${developments.total} developments.`}
              onDeleted={() => navigate('/admin/companies', { replace: true })}
            />
          </div>
        }
      />

      {tab === 'overview' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard icon={UserCheck} tone="cyan" label="Admins" value={formatNumber(members.admins.total)} hint={`${members.admins.active} active`} />
            <KpiCard icon={Users} tone="amber" label="Users" value={formatNumber(members.users.total)} hint={`${members.users.active} active`} />
            <KpiCard icon={HomeIcon} label="Properties" value={formatNumber(t.properties)} hint={`${properties.byStatus.live} live · ${t.incomplete} incomplete`} />
            <KpiCard icon={Landmark} tone="violet" label="Developments" value={formatNumber(developments.total)} hint={`${developments.byStatus.live} live`} />
            <KpiCard icon={Eye} tone="green" label="Views" value={formatNumber(t.views)} hint={`${formatNumber(t.liveViews)} on live listings`} />
            <KpiCard icon={MessageSquare} tone="rose" label="Enquiries" value={formatNumber(t.enquiries)} hint={`${t.enquiryRate}% enquiry rate`} />
            <KpiCard icon={CheckCircle2} tone="green" label="Signed in now" value={formatNumber(sessions.active)} hint="Organisation account sessions" />
            <KpiCard icon={Activity} tone="slate" label="Total sessions" value={formatNumber(sessions.total)} hint="Since the account was created" />
          </div>

          <div className="grid xl:grid-cols-3 gap-6">
            <Panel title="Profile" icon={Building2} className="xl:col-span-2">
              <div className="grid sm:grid-cols-2 gap-3">
                <InfoTile icon={Tag} label="Type" value={ORGANISATION_TYPES.find((o) => o.value === profile.type)?.label} />
                <InfoTile icon={Mail} label="Contact email" value={profile.contactEmail} href={profile.contactEmail && `mailto:${profile.contactEmail}`} />
                <InfoTile icon={Phone} label="Phone" value={profile.phone} />
                <InfoTile icon={Globe} label="Website" value={profile.website} href={profile.website} />
                <InfoTile icon={MapPin} label="Address" value={address} />
                <InfoTile icon={Globe} label="Public page" value={profile.slug && `/companies/${profile.slug}`} href={profile.slug && `/companies/${profile.slug}`} />
              </div>
              {profile.description && <p className="text-sm text-gray-600 mt-4 whitespace-pre-line leading-relaxed">{profile.description}</p>}
            </Panel>
            <LoginIpsPanel loginIps={loginIps} />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Panel title="Properties by status" icon={HomeIcon}>
              <SplitBar items={statusItems(properties.byStatus, PROPERTY_STATUS_VALUES)} />
            </Panel>
            <Panel title="Developments by status" icon={Landmark}>
              <SplitBar items={statusItems(developments.byStatus, DEVELOPMENT_STATUS_VALUES)} />
            </Panel>
          </div>
        </>
      )}

      {(tab === 'admins' || tab === 'users') && <CompanyMembersTable key={tab} companyId={companyId} memberType={tab} />}

      {tab === 'properties' && (
        <PropertiesTable prefix="properties." fixed={{ owner: companyId, ownerType: 'organisation' }} hide={['owner', 'ownerType']} emptyText="This organisation has no properties" />
      )}

      {tab === 'developments' && (
        <DevelopmentsTable prefix="developments." fixed={{ owner: companyId }} hide={['owner']} emptyText="This organisation has no developments" />
      )}

      {tab === 'activity' && (
        <SessionsPanel
          title="Organisation account sessions & activity"
          queryKey={queryKey}
          list={(params) => adminApi.getCompanySessions(companyId, params)}
          listActivities={(sessionId, params) => adminApi.getCompanySessionActivities(companyId, sessionId, params)}
        />
      )}

      {editing && (
        <EditAccountModal
          account={company}
          save={(body) => adminApi.updateCompany(companyId, body)}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ['admin'] })}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}
