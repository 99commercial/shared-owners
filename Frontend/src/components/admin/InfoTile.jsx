/** Small labelled value in a detail grid */
export default function InfoTile({ icon: Icon, label, value, href }) {
  const display = value || value === 0 ? value : '—';
  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/60 px-3.5 py-3 min-w-0">
      {Icon && <Icon className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" />}
      <div className="min-w-0">
        <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{label}</div>
        {href && value ? (
          <a href={href} target="_blank" rel="noreferrer" className="text-sm font-medium text-brand-700 hover:underline break-words">{display}</a>
        ) : (
          <div className="text-sm font-medium text-ink break-words">{display}</div>
        )}
      </div>
    </div>
  );
}
