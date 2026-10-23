import { BadgeCheck, CalendarDays, Clock, Globe, Mail, Activity } from 'lucide-react';
import { Avatar } from '../../../components/admin/AccountCell';
import InfoTile from '../../../components/admin/InfoTile';
import { ROLE_LABELS } from '../../../data/adminOptions';
import { accountName, accountStatus, formatDate, formatDateTime, timeAgo } from '../../../utils/format';

/**
 * Identity card at the top of every account detail page: photo, name, status,
 * sign-in facts, then any extra tiles passed as children.
 */
export default function AccountSummaryCard({ account, sessions, actions, children }) {
  const status = accountStatus(account);
  return (
    <div className="dash-card p-5 sm:p-6">
      <div className="flex flex-col lg:flex-row lg:items-center gap-5">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <Avatar account={account} size="xl" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-extrabold text-ink truncate">{accountName(account)}</h2>
              <span className={`badge ${status.className}`}>{status.label}</span>
            </div>
            <div className="text-sm text-gray-500 flex items-center gap-1.5 mt-1 truncate"><Mail className="w-4 h-4 shrink-0" />{account.email}</div>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="badge bg-brand-50 text-brand-700">{ROLE_LABELS[account.role]}</span>
              {account.isVerified && <span className="badge bg-green-50 text-green-700"><BadgeCheck className="w-3 h-3" /> Verified</span>}
            </div>
          </div>
        </div>
        {actions && <div className="lg:max-w-md">{actions}</div>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-6">
        <InfoTile icon={CalendarDays} label="Joined" value={formatDate(account.createdAt)} />
        <InfoTile
          icon={Clock}
          label="Last login"
          value={account.lastLogin?.at ? `${formatDateTime(account.lastLogin.at)}` : 'Never'}
        />
        <InfoTile icon={Globe} label="Last login IP" value={account.lastLogin?.ip} />
        <InfoTile
          icon={Activity}
          label="Last active"
          value={sessions ? `${timeAgo(sessions.lastActiveAt)} · ${sessions.active} active of ${sessions.total} sessions` : timeAgo(account.lastActiveAt)}
        />
        {children}
      </div>
    </div>
  );
}
