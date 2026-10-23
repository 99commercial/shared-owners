import { Menu } from 'lucide-react';

export default function Topbar({ title, subtitle, onMenuClick }) {
  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur border-b border-gray-200 shadow-[0_1px_8px_-4px_rgba(0,0,0,0.12)] flex items-center gap-3 px-4 sm:px-5">
      <button onClick={onMenuClick} className="p-2 -ml-2 rounded-lg text-ink hover:bg-brand-50" aria-label="Toggle sidebar">
        <Menu className="w-5 h-5" />
      </button>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold text-ink leading-tight truncate">{title}</div>
        {subtitle && <div className="text-[11px] text-gray-500 truncate">{subtitle}</div>}
      </div>
    </header>
  );
}
