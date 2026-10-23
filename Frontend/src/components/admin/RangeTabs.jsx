import { RANGE_OPTIONS } from '../../data/adminOptions';

/** 7 / 30 / 90 days / 12 months switch for the analytics pages */
export default function RangeTabs({ value, onChange }) {
  return (
    <div className="inline-flex rounded-xl border border-brand-200 bg-white/80 p-1 shadow-sm">
      {RANGE_OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            value === o.value ? 'bg-brand-600 text-white shadow' : 'text-gray-600 hover:text-ink hover:bg-brand-50'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
