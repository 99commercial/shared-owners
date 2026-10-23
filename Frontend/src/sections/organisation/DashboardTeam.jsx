import { Link } from 'react-router-dom';
import { UserCheck, Users, MonitorSmartphone, Activity, Trophy, HomeIcon } from 'lucide-react';
import { getDisplayName } from '../../components/Sidebar';

const ROLE_LABELS = {
  organisation: 'Organisation',
  'organisation-admin': 'Admin',
  'organisation-user': 'User',
};

function Panel({ title, action, children }) {
  return (
    <div className="dash-card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-4 rounded-full bg-brand-500" />
          <h3 className="font-semibold text-ink">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

const accountName = (account) => (account?.deleted ? 'Removed account' : getDisplayName(account, account?.role));

const timeAgo = (date) => {
  const minutes = Math.round((Date.now() - new Date(date).getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)}h ago`;
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

function TeamSummary({ members, basePath }) {
  const rows = [
    { icon: UserCheck, label: 'Admins', ...members?.admins, to: basePath === '/org' ? '/org/admins' : null },
    { icon: Users, label: 'Users', ...members?.users, to: `${basePath}/users` },
  ];
  return (
    <Panel title="Team">
      <div className="p-5 space-y-3">
        {rows.map(({ icon: Icon, label, total = 0, active = 0, to }) => {
          const body = (
            <>
              <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center"><Icon className="w-4 h-4 text-brand-600" /></div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-ink">{label}</div>
                <div className="text-xs text-gray-500">{active} active of {total}</div>
              </div>
              <div className="text-xl font-extrabold text-ink">{total}</div>
            </>
          );
          const className = 'flex items-center gap-3 rounded-xl border border-gray-100 px-4 py-3';
          return to
            ? <Link key={label} to={to} className={`${className} hover:border-brand-200 hover:bg-brand-50/40`}>{body}</Link>
            : <div key={label} className={className}>{body}</div>;
        })}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="rounded-xl bg-gray-50 px-4 py-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500"><MonitorSmartphone className="w-3.5 h-3.5" />Signed in now</div>
            <div className="text-lg font-bold text-ink mt-1">{members?.activeSessions ?? 0}</div>
          </div>
          <div className="rounded-xl bg-gray-50 px-4 py-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500"><Activity className="w-3.5 h-3.5" />Actions (7 days)</div>
            <div className="text-lg font-bold text-ink mt-1">{members?.apiCallsLast7Days ?? 0}</div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function TopUploaders({ uploaders }) {
  return (
    <Panel title="Top uploaders">
      {uploaders.length === 0 ? (
        <p className="px-5 py-8 text-sm text-gray-400 text-center">Listings created by your team will be ranked here.</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {uploaders.map(({ user, properties, live }, i) => (
            <div key={user?._id || i} className="flex items-center gap-3 px-5 py-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                {i === 0 ? <Trophy className="w-4 h-4" /> : i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{accountName(user)}</div>
                <div className="text-xs text-gray-500">{ROLE_LABELS[user?.role] || '—'}</div>
              </div>
              <div className="text-right text-xs text-gray-500">
                <div className="flex items-center gap-1 justify-end font-semibold text-ink"><HomeIcon className="w-3.5 h-3.5" />{properties}</div>
                <div>{live} live</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

const METHOD_STYLES = {
  GET: 'bg-gray-100 text-gray-600',
  POST: 'bg-green-100 text-green-700',
  PUT: 'bg-blue-100 text-blue-700',
  PATCH: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
};

function RecentActivity({ activity }) {
  return (
    <Panel title="Recent activity">
      {activity.length === 0 ? (
        <p className="px-5 py-8 text-sm text-gray-400 text-center">Actions taken by your team will show up here.</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {activity.map((a) => (
            <div key={a._id} className="px-5 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-gray-900 truncate">{accountName(a.user)}</span>
                <span className="text-[11px] text-gray-400 whitespace-nowrap">{timeAgo(a.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2 mt-1 min-w-0">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${METHOD_STYLES[a.method] || METHOD_STYLES.GET}`}>{a.method}</span>
                <span className="text-xs text-gray-500 font-mono truncate">{a.path}</span>
                {a.impersonatedBy && <span className="text-[10px] text-amber-600 whitespace-nowrap">impersonated</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

/** Team-related parts of the organisation dashboard (owner at /org, admins at /org-admin) */
export default function DashboardTeam({ dashboard, basePath = '/org' }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
      <TeamSummary members={dashboard?.members} basePath={basePath} />
      <TopUploaders uploaders={dashboard?.topUploaders || []} />
      <RecentActivity activity={dashboard?.recentActivity || []} />
    </div>
  );
}
