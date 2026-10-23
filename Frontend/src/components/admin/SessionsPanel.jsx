import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Activity, ChevronDown, Globe, Loader2, Monitor, ShieldAlert, Smartphone, Tablet } from 'lucide-react';
import Panel from './Panel';
import { Pagination } from './DataTable';
import { deviceLabel, formatDateTime, formatNumber, formatTime, timeAgo } from '../../utils/format';

const METHOD_STYLES = {
  GET: 'bg-sky-100 text-sky-700',
  POST: 'bg-green-100 text-green-700',
  PATCH: 'bg-amber-100 text-amber-700',
  PUT: 'bg-amber-100 text-amber-700',
  DELETE: 'bg-red-100 text-red-700',
};

const statusTone = (code) => (code >= 500 ? 'text-red-600' : code >= 400 ? 'text-amber-600' : 'text-green-600');

const DEVICE_ICONS = { mobile: Smartphone, tablet: Tablet };

const END_REASONS = {
  logout: 'Signed out',
  evicted: 'Replaced by newer login',
  account_deleted: 'Account deleted',
  password_changed: 'Password changed',
  deactivated: 'Account deactivated',
};

function SessionActivities({ queryKey, sessionId, listActivities }) {
  const [page, setPage] = useState(1);
  const limit = 50;
  const { data, isLoading, isFetching } = useQuery({
    queryKey: [...queryKey, sessionId, 'activities', page],
    queryFn: () => listActivities(sessionId, { page, limit }).then((r) => r.data.data),
    placeholderData: keepPreviousData,
  });

  if (isLoading) return <div className="py-6 text-center"><Loader2 className="w-5 h-5 animate-spin text-brand-600 mx-auto" /></div>;
  const items = data?.items || [];
  if (!items.length) return <p className="py-5 text-center text-sm text-gray-400">No activity was recorded in this session.</p>;

  return (
    <div className={isFetching ? 'opacity-60' : ''}>
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[640px]">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wider text-gray-500">
              <th className="px-3 py-2 font-bold">Time</th>
              <th className="px-3 py-2 font-bold">Request</th>
              <th className="px-3 py-2 font-bold">Status</th>
              <th className="px-3 py-2 font-bold">Duration</th>
              <th className="px-3 py-2 font-bold">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((a) => (
              <tr key={a._id} className="hover:bg-white">
                <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{formatTime(a.createdAt)}</td>
                <td className="px-3 py-2">
                  <span className={`inline-block w-14 text-center rounded px-1.5 py-0.5 font-bold mr-2 ${METHOD_STYLES[a.method] || 'bg-gray-100 text-gray-700'}`}>
                    {a.method}
                  </span>
                  <span className="font-mono text-gray-700 break-all">{a.path}</span>
                  {a.impersonatedBy && <span className="ml-2 text-violet-600 font-semibold">(admin)</span>}
                </td>
                <td className={`px-3 py-2 font-bold ${statusTone(a.statusCode)}`}>{a.statusCode}</td>
                <td className="px-3 py-2 text-gray-500">{a.durationMs != null ? `${a.durationMs} ms` : '—'}</td>
                <td className="px-3 py-2 text-gray-500 font-mono">{a.ip || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.pagination.totalPages > 1 && (
        <Pagination pagination={data.pagination} page={page} limit={limit} onPage={setPage} />
      )}
    </div>
  );
}

/**
 * Login sessions of an account, newest first. Expanding a session lists every
 * request made during it. `list(params)` / `listActivities(sessionId, params)`
 * are the admin API calls for this account.
 */
export default function SessionsPanel({ queryKey, list, listActivities, title = 'Sessions & activity log' }) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [open, setOpen] = useState(null);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [...queryKey, 'sessions', page, limit],
    queryFn: () => list({ page, limit }).then((r) => r.data.data),
    placeholderData: keepPreviousData,
  });
  const sessions = data?.items || [];

  return (
    <Panel title={title} subtitle="Each login with the device it came from; expand one to see what was done" icon={Activity} bodyClassName="">
      {isLoading ? (
        <div className="py-14 text-center"><Loader2 className="w-6 h-6 animate-spin text-brand-600 mx-auto" /></div>
      ) : sessions.length === 0 ? (
        <p className="py-14 text-center text-sm text-gray-400">This account has never signed in.</p>
      ) : (
        <ul className={`divide-y divide-gray-100 ${isFetching ? 'opacity-60' : ''}`}>
          {sessions.map((s) => {
            const DeviceIcon = DEVICE_ICONS[s.device?.deviceType] || Monitor;
            const expanded = open === s._id;
            return (
              <li key={s._id}>
                <button
                  type="button"
                  onClick={() => setOpen(expanded ? null : s._id)}
                  className={`w-full flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3.5 text-left hover:bg-gray-50 ${expanded ? 'bg-gray-50' : ''}`}
                >
                  <div className="flex items-center gap-3 min-w-[220px] flex-1">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${s.impersonatedBy ? 'bg-violet-100 text-violet-700' : 'bg-brand-50 text-brand-700'}`}>
                      {s.impersonatedBy ? <ShieldAlert className="w-4 h-4" /> : <DeviceIcon className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-ink truncate">
                        {s.impersonatedBy ? 'Opened by a platform admin' : deviceLabel(s.device)}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Globe className="w-3 h-3" /> <span className="font-mono">{s.ip || 'Unknown IP'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 w-40">
                    <div className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Started</div>
                    {formatDateTime(s.startedAt)}
                  </div>
                  <div className="text-xs text-gray-500 w-28">
                    <div className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Last activity</div>
                    {timeAgo(s.lastActivityAt)}
                  </div>
                  <div className="text-xs text-gray-500 w-24">
                    <div className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Requests</div>
                    <span className="font-semibold text-ink">{formatNumber(s.activityCount)}</span>
                  </div>
                  <span className={`badge ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {s.isActive ? 'Active' : END_REASONS[s.endReason] || (s.endedAt ? 'Ended' : 'Expired')}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </button>
                {expanded && (
                  <div className="bg-gray-50 border-t border-gray-100 px-3 pb-2">
                    <SessionActivities queryKey={queryKey} sessionId={s._id} listActivities={listActivities} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {data?.pagination && data.pagination.total > 0 && (
        <Pagination
          pagination={data.pagination}
          page={page}
          limit={limit}
          onPage={setPage}
          onLimit={(l) => { setLimit(l); setPage(1); }}
        />
      )}
    </Panel>
  );
}

/** IP addresses the account signed in from, most recent first */
export function LoginIpsPanel({ loginIps = [] }) {
  return (
    <Panel title="Sign-in locations" subtitle="IP addresses used for the account's own logins" icon={Globe} bodyClassName="">
      {loginIps.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-400">No logins recorded.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {loginIps.map((row) => (
            <li key={row.ip} className="px-5 py-3 flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-mono text-sm text-ink">{row.ip}</div>
                <div className="text-xs text-gray-500 truncate">{deviceLabel(row.lastDevice)}</div>
              </div>
              <div className="text-right text-xs text-gray-500 shrink-0">
                <div className="font-semibold text-ink">{formatNumber(row.logins)} login{row.logins === 1 ? '' : 's'}</div>
                <div>last {timeAgo(row.lastSeenAt)}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
