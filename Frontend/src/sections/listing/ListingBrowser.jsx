import { useEffect, useRef, useState } from 'react';
import { ArrowUpDown, ChevronLeft, ChevronRight, LayoutGrid, Loader2, Map as MapIcon } from 'lucide-react';
import Dropdown from '../../components/Dropdown';
import ListingMap from './ListingMap';

const NAVBAR_HEIGHT = 64;

function ViewToggle({ view, setView }) {
  const options = [
    { key: 'split', label: 'Map and list', icon: MapIcon },
    { key: 'grid', label: 'List only', icon: LayoutGrid },
  ];
  return (
    <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
      {options.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          type="button"
          title={label}
          aria-label={label}
          aria-pressed={view === key}
          onClick={() => setView(key)}
          className={`p-2 rounded-md transition-colors ${view === key ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-ink'}`}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
}

export function ListingPagination({ pagination, onPage }) {
  if (!pagination || pagination.totalPages <= 1) return null;
  const { page, totalPages } = pagination;
  const button = 'inline-flex items-center gap-1 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
  return (
    <nav className="flex items-center justify-center gap-3 pt-8" aria-label="Pagination">
      <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className={`${button} text-gray-600 hover:bg-white hover:shadow-sm`}>
        <ChevronLeft className="w-4 h-4" /> Previous
      </button>
      <span className="text-sm text-gray-600">Page <b className="text-ink">{page}</b> of {totalPages}</span>
      <button type="button" disabled={page >= totalPages} onClick={() => onPage(page + 1)} className={`${button} bg-brand-500 text-white hover:bg-brand-600`}>
        Next <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}

/** Keeps the map pinned just below the (variable height) filter bar */
function useElementHeight() {
  const ref = useRef(null);
  const [height, setHeight] = useState(0);
  useEffect(() => {
    if (!ref.current) return undefined;
    const observer = new ResizeObserver(([entry]) => setHeight(entry.target.offsetHeight));
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, height];
}

/**
 * Public "browse" page: hero, sticky filter bar, map beside a grid of cards.
 * `renderCard(item, { active, onHover })`; `map` = { getCoords, getLabel, renderPopup }.
 */
export default function ListingBrowser({
  title,
  subtitle,
  toolbar,
  advanced,
  count,
  noun,
  heading,
  subheading,
  sort,
  view,
  setView,
  loading,
  fetching,
  items,
  renderCard,
  empty,
  map,
  pagination,
  onPage,
}) {
  const [activeId, setActiveId] = useState(null);
  const [barRef, barHeight] = useElementHeight();
  const listTop = useRef(null);
  const split = view !== 'grid';
  const stickyTop = NAVBAR_HEIGHT + barHeight;

  const changePage = (next) => {
    onPage(next);
    listTop.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const mapPanel = (
    <ListingMap
      items={items}
      activeId={activeId}
      getCoords={map.getCoords}
      getLabel={map.getLabel}
      renderPopup={map.renderPopup}
    />
  );

  return (
    <div className="bg-gray-50">
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-brand-50/60 to-white border-b border-brand-100">
        <div className="absolute -left-16 -top-24 w-72 h-72 rounded-full bg-white/60" />
        <div className="absolute right-10 -bottom-28 w-64 h-64 rounded-full bg-brand-100/60" />
        <div className="relative max-w-3xl mx-auto px-4 py-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">{title}</h1>
          <p className="text-gray-600 mt-2">{subtitle}</p>
        </div>
      </section>

      <div ref={barRef} className="relative sm:sticky sm:top-16 z-40 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm">
        <div className="px-4 sm:px-6 py-3 flex flex-wrap items-center gap-2.5">
          {toolbar}
          <div className="flex items-center gap-3 ml-auto">
            <span className="hidden sm:inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-xs text-gray-600">
              {fetching && !loading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-500" /> : <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />}
              Showing <b className="text-ink">{count ?? 0}</b> {noun}
            </span>
            <ViewToggle view={view} setView={setView} />
          </div>
        </div>
        {advanced && <div className="border-t border-gray-100 bg-gray-50/80">{advanced}</div>}
      </div>

      <div className={`flex ${split ? '' : 'max-w-[1600px] mx-auto'}`}>
        {split && (
          <aside
            className="hidden lg:block lg:w-1/2 shrink-0 sticky self-start border-r border-gray-200"
            style={{ top: stickyTop, height: `calc(100vh - ${stickyTop}px)` }}
          >
            {mapPanel}
          </aside>
        )}

        <main className="flex-1 min-w-0 px-4 sm:px-6 py-6">
          <div ref={listTop} className="flex flex-wrap items-end justify-between gap-3 mb-5 scroll-mt-40">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-ink">{heading}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{subheading}</p>
            </div>
            {sort && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 flex items-center gap-1 whitespace-nowrap"><ArrowUpDown className="w-3.5 h-3.5" /> Sort by</span>
                <Dropdown aria-label="Sort by" value={sort.value} onChange={sort.onChange} options={sort.options} className="w-48" />
              </div>
            )}
          </div>

          {split && items.length > 0 && (
            <div className="lg:hidden h-64 mb-5 -mx-4 sm:-mx-6 border-y border-gray-200">{mapPanel}</div>
          )}

          {loading ? (
            <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>
          ) : items.length === 0 ? (
            empty
          ) : (
            <div className={`grid gap-5 ${split ? 'sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4'} ${fetching ? 'opacity-60 transition-opacity' : ''}`}>
              {items.map((item) => renderCard(item, { active: item._id === activeId, onHover: setActiveId }))}
            </div>
          )}

          <ListingPagination pagination={pagination} onPage={changePage} />
        </main>
      </div>
    </div>
  );
}
