import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/**
 * Cream banner at the top of every dashboard page.
 * breadcrumbs = [{ label, to? }]; tabs = [{ key, label, icon }] rendered along the bottom edge.
 */
export default function PageHero({ label, title, subtitle, breadcrumbs = [], tabs, activeTab, onTabChange, action }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-brand-200 border-l-4 border-l-brand-500 bg-gradient-to-r from-cream via-brand-50 to-brand-100 mb-6">
      <div className="absolute -right-10 -top-16 w-56 h-56 rounded-full bg-white/40" />
      <div className="absolute right-24 -bottom-20 w-40 h-40 rounded-full bg-white/30" />
      {!tabs && <div className="absolute right-6 bottom-0 w-10 h-8 rounded-t-lg bg-brand-400/80 rotate-6 translate-y-2" />}

      <div className={`relative px-5 sm:px-7 pt-5 ${tabs ? 'pb-3' : 'pb-5'}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            {label && (
              <span className="inline-block px-2.5 py-0.5 mb-2 rounded-full border border-brand-300 bg-brand-100 text-[10px] font-bold tracking-wider text-ink uppercase">
                {label}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">{title}</h1>
            {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
            {breadcrumbs.length > 0 && (
              <nav className="flex items-center flex-wrap gap-1 mt-2 text-xs text-gray-500">
                {breadcrumbs.map((b, i) => {
                  const last = i === breadcrumbs.length - 1;
                  return (
                    <Fragment key={`${b.label}-${i}`}>
                      {b.to && !last ? (
                        <Link to={b.to} className="hover:text-ink">{b.label}</Link>
                      ) : (
                        <span className={last ? 'font-semibold text-ink' : ''}>{b.label}</span>
                      )}
                      {!last && <ChevronRight className="w-3 h-3" />}
                    </Fragment>
                  );
                })}
              </nav>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      </div>

      {tabs && (
        <div className="relative flex sm:justify-end gap-1 overflow-x-auto px-3 sm:px-6">
          {tabs.map(({ key, label: tabLabel, icon: Icon }) => {
            const active = key === activeTab;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onTabChange(key)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold whitespace-nowrap rounded-t-lg border-b-2 transition-colors ${
                  active ? 'bg-white text-ink border-brand-500' : 'text-gray-500 border-transparent hover:text-ink'
                }`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {tabLabel}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
