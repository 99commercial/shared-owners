import { Link } from 'react-router-dom';
import StatusBadge from '../../components/StatusBadge';
import { PROPERTY_STATUS_VALUES, PROPERTY_SECTIONS, SECTION_LABELS, labelize } from '../../data/propertyOptions';

function Panel({ title, children }) {
  return (
    <div className="dash-card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
        <span className="w-1.5 h-4 rounded-full bg-brand-500" />
        <h3 className="font-semibold text-ink">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Bar({ label, count, max, to }) {
  const width = max ? Math.max((count / max) * 100, count ? 4 : 0) : 0;
  const content = (
    <>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="font-medium text-gray-900">{count}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-brand-500 rounded-full" style={{ width: `${width}%` }} />
      </div>
    </>
  );
  return to ? <Link to={to} className="block hover:opacity-80">{content}</Link> : <div>{content}</div>;
}

/** Also used by the organisation dashboard; basePath points the status links at its properties page */
export default function DashboardBreakdown({ analytics, basePath = '/user' }) {
  const byStatus = analytics?.byStatus || {};
  const pending = analytics?.pendingApproval || {};
  const missing = analytics?.missingSections || {};
  const schemes = analytics?.bySchemeType || [];

  const statusMax = Math.max(...PROPERTY_STATUS_VALUES.map((s) => byStatus[s] || 0), 0);
  const requiredKeys = PROPERTY_SECTIONS.filter((s) => s.required).map((s) => s.key);
  const missingMax = Math.max(...requiredKeys.map((k) => missing[k] || 0), 0);
  const schemeMax = Math.max(...schemes.map((s) => s.count), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
      <Panel title="By status">
        <div className="space-y-3">
          {PROPERTY_STATUS_VALUES.map((s) => (
            <Bar key={s} label={<StatusBadge status={s} />} count={byStatus[s] || 0} max={statusMax} to={`${basePath}/properties?status=${s}`} />
          ))}
        </div>
        {(pending.create || 0) + (pending.edit || 0) > 0 && (
          <p className="text-xs text-gray-500 mt-4">
            Awaiting approval: {pending.create || 0} new, {pending.edit || 0} with changes
          </p>
        )}
      </Panel>

      <Panel title="Missing required sections">
        {missingMax === 0 ? (
          <p className="text-sm text-gray-400">All your listings have every required section complete.</p>
        ) : (
          <div className="space-y-3">
            {requiredKeys.map((k) => (
              <Bar key={k} label={SECTION_LABELS[k]} count={missing[k] || 0} max={missingMax} />
            ))}
          </div>
        )}
      </Panel>

      <Panel title="By scheme type">
        {schemes.length === 0 ? (
          <p className="text-sm text-gray-400">Set a scheme type in a listing's Details section to see it here.</p>
        ) : (
          <div className="space-y-3">
            {schemes.map((s) => (
              <Bar key={s.value} label={labelize(s.value)} count={s.count} max={schemeMax} />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
