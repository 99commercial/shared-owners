import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  Activity, BadgeCheck, Building2, Flame, Globe, LogIn, Monitor, ShieldAlert, UserPlus, Users, UserX,
} from 'lucide-react';
import { adminApi } from '../../../services/endpoints';
import useRange from '../../../hooks/useRange';
import PageHero from '../../../components/PageHero';
import Panel from '../../../components/admin/Panel';
import KpiCard from '../../../components/admin/KpiCard';
import RangeTabs from '../../../components/admin/RangeTabs';
import AccountCell from '../../../components/admin/AccountCell';
import { BarList, Donut, TrendChart } from '../../../components/admin/Charts';
import { PageError, PageLoader } from '../../../components/admin/QueryState';
import { ACCOUNT_ROLES, CHART_COLORS, ROLE_COLORS, ROLE_LABELS, ROLE_SHORT_LABELS } from '../../../data/adminOptions';
import { ORGANISATION_TYPES } from '../../../data/constants';
import { labelize } from '../../../data/propertyOptions';
import { accountName, formatNumber, percent, timeAgo } from '../../../utils/format';
import { adminAccountPath } from '../../../utils/adminPaths';

const ROLE_LIST_PATHS = {
  user: '/admin/users',
  organisation: '/admin/companies',
};

const toItems = (rows, labelFor = labelize) =>
  rows.map((r, i) => ({ label: labelFor(r.value), value: r.count, color: CHART_COLORS[i % CHART_COLORS.length] }));

const orgTypeLabel = (value) => ORGANISATION_TYPES.find((t) => t.value === value)?.label || labelize(value);

function RoleCard({ role, stats }) {
  const activeShare = percent(stats.active, stats.total);
  const to = ROLE_LIST_PATHS[role];
  const body = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{ROLE_LABELS[role]}s</span>
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: ROLE_COLORS[role] }} />
      </div>
      <div className="text-3xl font-extrabold text-ink mt-2">{formatNumber(stats.total)}</div>
      <div className="h-1.5 rounded-full bg-gray-100 mt-3 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${activeShare}%`, background: ROLE_COLORS[role] }} />
      </div>
      <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 mt-3 text-xs">
        <span className="text-gray-500">Active</span><span className="text-right font-semibold text-ink">{formatNumber(stats.active)}</span>
        <span className="text-gray-500">Deactivated</span><span className="text-right font-semibold text-ink">{formatNumber(stats.inactive)}</span>
        <span className="text-gray-500">{role === 'organisation-user' ? 'Awaiting approval' : 'Unverified'}</span>
        <span className="text-right font-semibold text-ink">{formatNumber(stats.unverified)}</span>
        <span className="text-gray-500">New in range</span><span className="text-right font-semibold text-green-600">+{formatNumber(stats.newInRange)}</span>
      </div>
    </>
  );
  return to ? (
    <Link to={to} className="dash-card p-5 hover:border-brand-300 hover:shadow-md transition-all">{body}</Link>
  ) : (
    <div className="dash-card p-5">{body}</div>
  );
}

export default function AdminAccountAnalyticsPage() {
  const { days, setDays, label } = useRange();
  const { data: a, isLoading, error, isFetching } = useQuery({
    queryKey: ['admin', 'analytics', 'accounts', days],
    queryFn: () => adminApi.getAccountAnalytics({ days }).then((r) => r.data.data),
    placeholderData: keepPreviousData,
  });

  const hero = (
    <PageHero
      label="Analytics"
      title="Accounts"
      subtitle="Every individual user, organisation and organisation member on the platform"
      breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Analytics' }, { label: 'Accounts' }]}
      action={<RangeTabs value={days} onChange={setDays} />}
    />
  );

  if (isLoading) return <div className="p-4 sm:p-6 lg:p-8">{hero}<PageLoader /></div>;
  if (error) return <div className="p-4 sm:p-6 lg:p-8">{hero}<PageError error={error} /></div>;

  const { all, byRole } = a.totals;
  const signupSeries = ACCOUNT_ROLES.map((role) => ({ key: role, label: ROLE_SHORT_LABELS[role], color: ROLE_COLORS[role] }));

  return (
    <div className={`p-4 sm:p-6 lg:p-8 space-y-6 ${isFetching ? 'opacity-70 transition-opacity' : ''}`}>
      {hero}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Users} label="All accounts" value={formatNumber(all.total)} hint={`${percent(all.active, all.total)}% active`} />
        <KpiCard icon={UserPlus} tone="violet" label={`New in ${label}`} value={formatNumber(all.newInRange)} hint="Across every account type" />
        <KpiCard icon={LogIn} tone="cyan" label={`Logins in ${label}`} value={formatNumber(a.sessions.loginsInRange)} hint="Own logins (excludes admin access)" />
        <KpiCard icon={Activity} tone="green" label="Signed in now" value={formatNumber(a.sessions.active)} hint="Sessions that have not ended" />
        <KpiCard icon={UserX} tone="rose" label="Deactivated" value={formatNumber(all.inactive)} hint="Cannot sign in" />
        <KpiCard icon={BadgeCheck} tone="amber" label="Unverified / pending" value={formatNumber(all.unverified)} hint="Email or organisation approval outstanding" />
        <KpiCard icon={ShieldAlert} tone="slate" label="Opened by admins" value={formatNumber(a.sessions.impersonationsInRange)} hint={`Admin sessions in ${label}`} />
        <KpiCard icon={Building2} tone="violet" label="Organisation types" value={formatNumber(a.companiesByType.length)} hint="Distinct types registered" />
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {ACCOUNT_ROLES.map((role) => <RoleCard key={role} role={role} stats={byRole[role]} />)}
      </div>

      <div className="grid xl:grid-cols-2 gap-6">
        <Panel title="Sign-ups per day" subtitle={`By account type, last ${label}`} icon={UserPlus}>
          <TrendChart data={a.signupsByDay} series={signupSeries} type="bar" />
        </Panel>
        <Panel title="Logins per day" subtitle="Total logins and the number of distinct accounts" icon={LogIn}>
          <TrendChart
            data={a.loginsByDay}
            series={[
              { key: 'logins', label: 'Logins', color: '#2563eb' },
              { key: 'uniqueAccounts', label: 'Distinct accounts', color: '#16a34a' },
            ]}
          />
        </Panel>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Panel title="Devices" subtitle={`Logins in ${label}`} icon={Monitor}>
          <Donut items={toItems(a.devices)} centerLabel="Logins" />
        </Panel>
        <Panel title="Browsers" icon={Globe}>
          <BarList items={toItems(a.browsers, (v) => v)} />
        </Panel>
        <Panel title="Operating systems" icon={Monitor}>
          <BarList items={toItems(a.operatingSystems, (v) => v)} color="#7c3aed" />
        </Panel>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Panel title="Organisations by type" icon={Building2}>
          <Donut items={toItems(a.companiesByType, orgTypeLabel)} centerLabel="Organisations" />
        </Panel>
        <Panel title="Largest organisations" subtitle="By number of admins and users" icon={Users} className="lg:col-span-2">
          <BarList
            items={a.largestCompanies.map((row) => ({
              key: row.company._id,
              label: accountName(row.company),
              value: row.members,
              to: adminAccountPath(row.company),
              sub: 'members',
            }))}
            color="#7c3aed"
            empty="No organisation has members yet"
          />
        </Panel>
      </div>

      <div className="grid xl:grid-cols-5 gap-6">
        <Panel title="Most active accounts" subtitle={`Requests made in ${label}`} icon={Flame} className="xl:col-span-3" bodyClassName="">
          {a.mostActive.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-400">No activity in this period</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-[11px] uppercase tracking-wider text-gray-500">
                  <th className="px-5 py-2.5 font-bold">Account</th>
                  <th className="px-3 py-2.5 font-bold hidden sm:table-cell">Type</th>
                  <th className="px-3 py-2.5 font-bold text-right">Requests</th>
                  <th className="px-5 py-2.5 font-bold text-right">Last seen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {a.mostActive.map((row) => (
                  <tr key={row.account._id} className="hover:bg-gray-50">
                    <td className="px-5 py-2.5 max-w-0 w-1/2"><AccountCell account={row.account} to={adminAccountPath(row.account)} /></td>
                    <td className="px-3 py-2.5 hidden sm:table-cell">
                      <span className="badge bg-gray-100 text-gray-600">{ROLE_LABELS[row.account.role] || '—'}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-ink">{formatNumber(row.actions)}</td>
                    <td className="px-5 py-2.5 text-right text-xs text-gray-500">{timeAgo(row.lastActionAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        <Panel title="Newest accounts" icon={UserPlus} className="xl:col-span-2" bodyClassName="">
          <ul className="divide-y divide-gray-100">
            {a.recentSignups.map((acc) => (
              <li key={acc._id} className="px-5 py-2.5 flex items-center gap-3">
                <div className="flex-1 min-w-0"><AccountCell account={acc} to={adminAccountPath(acc)} sub={ROLE_LABELS[acc.role]} /></div>
                <span className="text-xs text-gray-400 shrink-0">{timeAgo(acc.createdAt)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
