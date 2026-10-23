/** White card with a titled header, used by every admin dashboard and detail page */
export default function Panel({ title, subtitle, icon: Icon, action, children, className = '', bodyClassName = 'p-5' }) {
  return (
    <div className={`dash-card overflow-hidden flex flex-col ${className}`}>
      {title && (
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {Icon ? <Icon className="w-4 h-4 text-brand-600 shrink-0" /> : <span className="w-1.5 h-4 rounded-full bg-brand-500 shrink-0" />}
            <div className="min-w-0">
              <h3 className="font-semibold text-ink truncate">{title}</h3>
              {subtitle && <p className="text-xs text-gray-500 truncate">{subtitle}</p>}
            </div>
          </div>
          {action}
        </div>
      )}
      <div className={`flex-1 ${bodyClassName}`}>{children}</div>
    </div>
  );
}
