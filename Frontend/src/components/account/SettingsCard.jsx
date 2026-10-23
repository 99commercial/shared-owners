/** Gradient header used by every account / profile settings card */
export function CardHeader({ icon: Icon, title, description }) {
  return (
    <div className="bg-gradient-to-r from-brand-600 to-brand-400 px-6 py-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
        <Icon className="w-5 h-5 text-brand-600" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-white leading-tight">{title}</h2>
        {description && <p className="text-xs text-white/80">{description}</p>}
      </div>
    </div>
  );
}

export function SubSection({ title, description, children }) {
  return (
    <div className="not-first:pt-6 not-first:border-t not-first:border-gray-100">
      <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
      {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      <div className="mt-5">{children}</div>
    </div>
  );
}
