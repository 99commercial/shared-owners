/** White section card with the accent-bar heading used throughout the listing pages */
export default function DetailCard({ title, icon: Icon, action, id, children, className = '', bodyClassName = 'p-5 sm:p-6' }) {
  return (
    <section id={id} className={`scroll-mt-24 rounded-2xl bg-white border border-gray-200 shadow-sm ${className}`}>
      <header className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-gray-100">
        <h2 className="flex items-center gap-2.5 text-base font-extrabold text-ink">
          <span className="w-1 h-5 rounded-full bg-brand-500" />
          {Icon && <Icon className="w-4 h-4 text-brand-500" />}
          {title}
        </h2>
        {action}
      </header>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
