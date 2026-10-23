export default function CardTile({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl bg-brand-50/70 border border-brand-100 px-3 py-2.5 min-w-0">
      <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-500"><Icon className="w-3 h-3" />{label}</p>
      <p className="text-sm font-bold text-ink mt-0.5 truncate">{value || '—'}</p>
    </div>
  );
}
