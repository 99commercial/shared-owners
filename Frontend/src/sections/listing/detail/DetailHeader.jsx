import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChevronRight, Link2, MapPin, Printer, Share2 } from 'lucide-react';

function ShareButtons({ title }) {
  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // Closing the share sheet is not an error
      }
      return;
    }
    await navigator.clipboard?.writeText(url);
    toast.success('Link copied');
  };
  const copy = async () => {
    await navigator.clipboard?.writeText(window.location.href);
    toast.success('Link copied');
  };
  const button = 'w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors';
  return (
    <div className="flex gap-2">
      <button type="button" onClick={share} className={button} title="Share" aria-label="Share"><Share2 className="w-4 h-4" /></button>
      <button type="button" onClick={copy} className={button} title="Copy link" aria-label="Copy link"><Link2 className="w-4 h-4" /></button>
      <button type="button" onClick={() => window.print()} className={button} title="Print" aria-label="Print"><Printer className="w-4 h-4" /></button>
    </div>
  );
}

/**
 * Top of a listing page. badges = [{ label, className }], stats = [{ label, value, hint }],
 * aside = content of the navy price panel on the right.
 */
export default function DetailHeader({ breadcrumbs, badges, title, address, stats, aside, shareTitle }) {
  return (
    <>
      <nav className="flex items-center flex-wrap gap-1.5 text-xs text-gray-500 mb-4" aria-label="Breadcrumb">
        {breadcrumbs.map((b, i) => (
          <Fragment key={b.label}>
            {b.to ? <Link to={b.to} className="hover:text-brand-600">{b.label}</Link> : <span className="font-semibold text-ink truncate max-w-[60vw]">{b.label}</span>}
            {i < breadcrumbs.length - 1 && <ChevronRight className="w-3 h-3" />}
          </Fragment>
        ))}
      </nav>

      <section className="grid lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_420px] rounded-2xl overflow-hidden border border-brand-100 shadow-sm">
        <div className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-brand-50/40 p-5 sm:p-7">
          <div className="absolute -right-16 -top-20 w-56 h-56 rounded-full bg-brand-100/50" />
          <div className="relative">
            <div className="flex flex-wrap gap-1.5">
              {badges.filter(Boolean).map((b) => (
                <span key={b.label} className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${b.className || 'bg-white border border-brand-200 text-ink'}`}>{b.label}</span>
              ))}
            </div>
            <h1 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink tracking-tight">{title}</h1>
            {address && (
              <p className="flex items-start gap-1.5 mt-2 text-sm text-gray-600"><MapPin className="w-4 h-4 mt-0.5 shrink-0 text-brand-500" />{address}</p>
            )}
            {stats.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
                {stats.map((s) => (
                  <div key={s.label} className="rounded-xl bg-white border border-brand-100 px-4 py-3 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{s.label}</p>
                    <p className="text-lg font-extrabold text-ink mt-0.5">{s.value}</p>
                    {s.hint && <p className="text-[11px] text-gray-500">{s.hint}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-900 text-white p-5 sm:p-6 flex flex-col gap-5">
          <div className="flex justify-end"><ShareButtons title={shareTitle || title} /></div>
          {aside}
        </div>
      </section>
    </>
  );
}
