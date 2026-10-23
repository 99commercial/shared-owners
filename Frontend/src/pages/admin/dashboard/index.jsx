import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Activity, ArrowRight, BarChart3, Building2, CheckSquare, Clock, FileText, HomeIcon, Inbox, Landmark,
  LogIn, Mail, UserPlus, Users, UsersRound,
} from 'lucide-react';
import { adminApi } from '../../../services/endpoints';
import { useAuth } from '../../../hooks/useAuth';
import PageHero from '../../../components/PageHero';
import Panel from '../../../components/admin/Panel';
import KpiCard from '../../../components/admin/KpiCard';
import AccountCell from '../../../components/admin/AccountCell';
import { BarList, SplitBar, TrendChart } from '../../../components/admin/Charts';
import { PageError, PageLoader } from '../../../components/admin/QueryState';
import { ROLE_COLORS, ROLE_LABELS, STATUS_COLORS } from '../../../data/adminOptions';
import { PROPERTY_STATUS_VALUES, labelize } from '../../../data/propertyOptions';
import { DEVELOPMENT_STATUS_VALUES } from '../../../data/developmentOptions';
import { accountName, deviceLabel, formatNumber, profileOf, timeAgo } from '../../../utils/format';
import { adminAccountPath } from '../../../utils/adminPaths';

const TREND_SERIES = [
  { key: 'signups', label: 'Sign-ups', color: '#7c3aed' },
  { key: 'logins', label: 'Logins', color: '#2563eb' },
  { key: 'properties', label: 'New properties', color: '#16a34a' },
  { key: 'developments', label: 'New developments', color: '#f59e0b' },
];

const ANALYTICS_LINKS = [
  { to: '/admin/analytics/accounts', label: 'Accounts analytics', text: 'Sign-ups, logins, devices and the most active accounts', icon: Users, tone: 'bg-violet-100 text-violet-700' },
  { to: '/admin/analytics/properties', label: 'Property analytics', text: 'Listings by status, scheme, price band and location', icon: HomeIcon, tone: 'bg-green-100 text-green-700' },
  { to: '/admin/analytics/developments', label: 'Development analytics', text: 'Schemes, linked homes and the busiest developers', icon: Landmark, tone: 'bg-amber-100 text-amber-700' },
];

const statusItems = (byStatus, values) =>
  values.map((s) => ({ label: labelize(s), value: byStatus?.[s] || 0, color: STATUS_COLORS[s] }));

function ListLink({ to, children }) {
  return (
    <Link to={to} className="text-xs font-semibold text-brand-700 hover:underline inline-flex items-center gap-1">
      {children} <ArrowRight className="w-3.5 h-3.5" />
    </Link>
  );
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { data: d, isLoading, error } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => adminApi.getDashboard().then((r) => r.data.data),
  });
  const firstName = profileOf(user).firstName;
  const [today] = useState(() =>
    new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));

  const hero = (
    <PageHero
      label="Platform admin"
      title={`Welcome back${firstName ? `, ${firstName}` : ''}!`}
      subtitle={today}
      breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Dashboard' }]}
      action={
        <Link to="/admin/approvals" className="btn-brand">
          <CheckSquare className="w-4 h-4" /> Review approvals
          {d?.approvalQueue?.total > 0 && <span className="ml-1 rounded-full bg-white/25 px-2 text-xs">{d.approvalQueue.total}</span>}
        </Link>
      }
    />
  );

  if (isLoading) return <div className="p-4 sm:p-6 lg:p-8">{hero}<PageLoader /></div>;
  if (error) return <div className="p-4 sm:p-6 lg:p-8">{hero}<PageError error={error} /></div>;

  const { accounts, properties, developments, sessions, approvalQueue, content } = d;
  const members = accounts.companyAdmins.total + accounts.companyUsers.total;
  const queries = content.contactQueries;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {hero}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Users} tone="brand" label="Individual users" value={formatNumber(accounts.users.total)} hint={`+${accounts.users.newLast30Days} in the last 30 days`} to="/admin/users" />
        <KpiCard icon={Building2} tone="violet" label="Organisations" value={formatNumber(accounts.companies.total)} hint={`+${accounts.companies.newLast30Days} in the last 30 days`} to="/admin/companies" />
        <KpiCard icon={UsersRound} tone="cyan" label="Organisation members" value={formatNumber(members)} hint={`${accounts.companyAdmins.total} admins · ${accounts.companyUsers.total} users`} to="/admin/analytics/accounts" />
        <KpiCard icon={Activity} tone="green" label="Signed in now" value={formatNumber(sessions.active)} hint={`${formatNumber(sessions.loginsLast7Days)} logins in 7 days`} to="/admin/analytics/accounts" />
        <KpiCard icon={HomeIcon} tone="green" label="Properties" value={formatNumber(properties.total)} hint={`${properties.byStatus.live} live · ${properties.premium} premium`} to="/admin/properties" />
        <KpiCard icon={Landmark} tone="amber" label="Developments" value={formatNumber(developments.total)} hint={`${developments.byStatus.live} live`} to="/admin/developments" />
        <KpiCard icon={CheckSquare} tone="rose" label="Awaiting approval" value={formatNumber(approvalQueue.total)} hint="Individual users' listings" to="/admin/approvals" />
        <KpiCard icon={Inbox} tone="slate" label="New contact queries" value={formatNumber(queries.byStatus.new)} hint={`${formatNumber(queries.total)} received in total`} to="/admin/queries?status=new" />
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        <Panel title="Platform activity" subtitle="Last 14 days" icon={BarChart3} className="xl:col-span-2">
          <TrendChart data={d.trend} series={TREND_SERIES} />
        </Panel>

        <Panel
          title="Approval queue"
          subtitle="Oldest requests first"
          icon={Clock}
          action={<ListLink to="/admin/approvals">Open queue</ListLink>}
          bodyClassName=""
        >
          {approvalQueue.oldest.length === 0 ? (
            <div className="py-12 text-center">
              <CheckSquare className="w-9 h-9 text-green-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Nothing is waiting for review</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {approvalQueue.oldest.map((p) => (
                <li key={p._id} className="px-5 py-3">
                  <Link to="/admin/approvals" className="block group">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-ink truncate group-hover:text-brand-700">{p.name || 'Untitled property'}</span>
                      <span className="badge bg-amber-100 text-amber-700 shrink-0">{labelize(p.approval?.requestType || 'review')}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 truncate">
                      {accountName(p.owner)} · submitted {timeAgo(p.approval?.submittedAt)}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {ANALYTICS_LINKS.map(({ to, label, text, icon: Icon, tone }) => (
          <Link key={to} to={to} className="dash-card p-5 flex items-center gap-4 group hover:border-brand-300 hover:shadow-md transition-all">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${tone}`}><Icon className="w-6 h-6" /></div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-ink group-hover:text-brand-700">{label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{text}</div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-brand-600 shrink-0" />
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Panel title="Properties by status" icon={HomeIcon} action={<ListLink to="/admin/analytics/properties">Details</ListLink>}>
          <SplitBar items={statusItems(properties.byStatus, PROPERTY_STATUS_VALUES)} />
          <div className="grid grid-cols-2 gap-3 mt-5 text-sm">
            <div className="rounded-xl bg-gray-50 p-3">
              <div className="text-xs text-gray-500">By individual users</div>
              <div className="text-lg font-bold text-ink">{formatNumber(properties.byOwnerType.user)}</div>
            </div>
            <div className="rounded-xl bg-gray-50 p-3">
              <div className="text-xs text-gray-500">By organisations</div>
              <div className="text-lg font-bold text-ink">{formatNumber(properties.byOwnerType.organisation)}</div>
            </div>
            <div className="rounded-xl bg-gray-50 p-3">
              <div className="text-xs text-gray-500">Total views</div>
              <div className="text-lg font-bold text-ink">{formatNumber(properties.views)}</div>
            </div>
            <div className="rounded-xl bg-gray-50 p-3">
              <div className="text-xs text-gray-500">Enquiries</div>
              <div className="text-lg font-bold text-ink">{formatNumber(properties.enquiries)}</div>
            </div>
          </div>
        </Panel>

        <Panel title="Developments by status" icon={Landmark} action={<ListLink to="/admin/analytics/developments">Details</ListLink>}>
          <SplitBar items={statusItems(developments.byStatus, DEVELOPMENT_STATUS_VALUES)} />
          <div className="mt-6">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-3">Signed in now, by account type</div>
            <BarList
              items={Object.entries(sessions.activeByRole)
                .filter(([role]) => ROLE_LABELS[role])
                .map(([role, value]) => ({ label: ROLE_LABELS[role], value, color: ROLE_COLORS[role] || '#64748b' }))}
              empty="Nobody is signed in right now"
            />
          </div>
        </Panel>

        <Panel title="Content" icon={FileText} bodyClassName="">
          <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100 text-center">
            <Link to="/admin/blogs" className="py-4 hover:bg-gray-50">
              <div className="text-xl font-bold text-ink">{formatNumber(content.blogs.byStatus.published)}</div>
              <div className="text-[11px] uppercase tracking-wider text-gray-500">Published</div>
            </Link>
            <Link to="/admin/blogs?status=draft" className="py-4 hover:bg-gray-50">
              <div className="text-xl font-bold text-ink">{formatNumber(content.blogs.byStatus.draft)}</div>
              <div className="text-[11px] uppercase tracking-wider text-gray-500">Drafts</div>
            </Link>
            <div className="py-4">
              <div className="text-xl font-bold text-ink">{formatNumber(content.blogs.views)}</div>
              <div className="text-[11px] uppercase tracking-wider text-gray-500">Blog views</div>
            </div>
          </div>
          <div className="px-5 pt-4 pb-2 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Latest unread queries</span>
            <ListLink to="/admin/queries">Inbox</ListLink>
          </div>
          {queries.latestNew.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-gray-400">No unread contact queries.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {queries.latestNew.map((q) => (
                <li key={q._id}>
                  <Link to={`/admin/queries?open=${q._id}`} className="flex items-start gap-3 px-5 py-2.5 hover:bg-gray-50">
                    <Mail className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-ink truncate">{q.subject || 'No subject'}</div>
                      <div className="text-xs text-gray-500 truncate">{q.name} · {timeAgo(q.createdAt)}</div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Panel title="Recent sign-ups" icon={UserPlus} action={<ListLink to="/admin/analytics/accounts">All accounts</ListLink>} bodyClassName="">
          <ul className="divide-y divide-gray-100">
            {d.recentSignups.map((a) => (
              <li key={a._id} className="px-5 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0"><AccountCell account={a} to={adminAccountPath(a)} /></div>
                <span className="badge bg-gray-100 text-gray-600 shrink-0">{ROLE_LABELS[a.role]}</span>
                <span className="text-xs text-gray-400 w-16 text-right shrink-0">{timeAgo(a.createdAt)}</span>
              </li>
            ))}
            {d.recentSignups.length === 0 && <li className="px-5 py-10 text-center text-sm text-gray-400">No sign-ups yet</li>}
          </ul>
        </Panel>

        <Panel title="Recent logins" icon={LogIn} bodyClassName="">
          <ul className="divide-y divide-gray-100">
            {d.recentLogins.map((s) => (
              <li key={s._id} className="px-5 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <AccountCell account={s.user || { deleted: true }} to={adminAccountPath(s.user)} sub={`${deviceLabel(s.device)} · ${s.ip || 'unknown IP'}`} />
                </div>
                <span className="badge bg-gray-100 text-gray-600 shrink-0">{ROLE_LABELS[s.role] || s.role}</span>
                <span className="text-xs text-gray-400 w-16 text-right shrink-0">{timeAgo(s.createdAt)}</span>
              </li>
            ))}
            {d.recentLogins.length === 0 && <li className="px-5 py-10 text-center text-sm text-gray-400">No logins yet</li>}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
