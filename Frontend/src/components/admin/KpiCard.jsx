import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

const TONES = {
  brand: 'bg-brand-100 text-brand-700',
  violet: 'bg-violet-100 text-violet-700',
  cyan: 'bg-cyan-100 text-cyan-700',
  amber: 'bg-amber-100 text-amber-700',
  green: 'bg-green-100 text-green-700',
  rose: 'bg-rose-100 text-rose-700',
  slate: 'bg-slate-100 text-slate-700',
};

export default function KpiCard({ icon: Icon, label, value, hint, tone = 'brand', to }) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 truncate">{label}</div>
          <div className="text-2xl font-extrabold text-ink mt-1.5 leading-none">{value}</div>
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${TONES[tone]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {hint && (
        <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
          <span className="truncate">{hint}</span>
          {to && <ArrowUpRight className="w-3.5 h-3.5 ml-auto shrink-0 text-gray-400 group-hover:text-brand-600" />}
        </div>
      )}
    </>
  );

  const className = 'dash-card p-4 block';
  return to ? (
    <Link to={to} className={`${className} group hover:border-brand-300 hover:shadow-md transition-all`}>{body}</Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
