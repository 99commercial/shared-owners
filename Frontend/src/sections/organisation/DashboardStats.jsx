import { Link } from 'react-router-dom';
import { HomeIcon, Eye, MessageSquare, AlertTriangle, Plus, CheckCircle2, UserCheck, Users, Percent } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import PageHero from '../../components/PageHero';

function StatTile({ label, value, icon: Icon, to }) {
  const body = (
    <>
      <div className="w-11 h-11 rounded-full bg-brand-500 flex items-center justify-center shrink-0 shadow-[0_4px_12px_-4px_rgba(37,99,235,0.6)]">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-extrabold text-ink leading-none">{value}</div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mt-1.5">{label}</div>
      </div>
    </>
  );
  const className = 'dash-card p-4 flex items-center gap-3';
  return to ? <Link to={to} className={`${className} hover:border-brand-300 transition-colors`}>{body}</Link> : <div className={className}>{body}</div>;
}

/**
 * `dashboard` is the organisation dashboard response, shared by the organisation account (/org)
 * and its admins (/org-admin). Admins have no admins page, so that tile only links for the owner.
 */
export default function DashboardStats({ dashboard, basePath = '/org' }) {
  const { user } = useAuth();
  const t = dashboard?.properties?.totals || {};
  const byStatus = dashboard?.properties?.byStatus || {};
  const members = dashboard?.members || {};
  const name = user?.organisationProfile?.name || user?.organisationAdminProfile?.firstName;
  const isOwner = basePath === '/org';

  return (
    <>
      <PageHero
        label="Dashboard"
        title={`Welcome back${name ? `, ${name}` : ''}!`}
        subtitle="An overview of your organisation's listings and team"
        breadcrumbs={[{ label: 'Home', to: basePath }, { label: 'Dashboard' }]}
        action={
          <Link to={`${basePath}/properties/new`} className="btn-brand">
            <Plus className="w-4 h-4" /> Create Property
          </Link>
        }
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatTile label="Properties" value={t.properties ?? 0} icon={HomeIcon} to={`${basePath}/properties`} />
        <StatTile label="Live" value={byStatus.live ?? 0} icon={CheckCircle2} to={`${basePath}/properties?status=live`} />
        <StatTile label="Incomplete" value={t.incomplete ?? 0} icon={AlertTriangle} to={`${basePath}/properties?status=draft`} />
        <StatTile label="Total views" value={t.views ?? 0} icon={Eye} />
        <StatTile label="Enquiries" value={t.enquiries ?? 0} icon={MessageSquare} />
        <StatTile label="Enquiry rate" value={`${t.enquiryRate ?? 0}%`} icon={Percent} />
        <StatTile label="Admins" value={members.admins?.total ?? 0} icon={UserCheck} to={isOwner ? '/org/admins' : undefined} />
        <StatTile label="Users" value={members.users?.total ?? 0} icon={Users} to={`${basePath}/users`} />
      </div>
    </>
  );
}
