/** Icon tiles; entries without a value are skipped */
export default function FactGrid({ items, className = 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4' }) {
  const shown = items.filter((item) => item.value !== null && item.value !== undefined && item.value !== '');
  if (!shown.length) return <p className="text-sm text-gray-400">No details added yet.</p>;
  return (
    <div className={`grid gap-3 ${className}`}>
      {shown.map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/70 p-3.5">
          <span className="shrink-0 w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center"><Icon className="w-4 h-4" /></span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</p>
            <p className="text-sm font-bold text-ink mt-0.5 break-words">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
