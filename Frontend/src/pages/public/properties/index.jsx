import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { BedDouble, Home, PoundSterling, Search, SearchX, SlidersHorizontal, X } from 'lucide-react';
import { commonApi } from '../../../services/endpoints';
import useListParams from '../../../hooks/useListParams';
import Dropdown from '../../../components/Dropdown';
import ListingBrowser from '../../../sections/listing/ListingBrowser';
import PropertyCard from '../../../sections/property/PropertyCard';
import { AVAILABILITY, PROPERTY_TYPES, SCHEME_TYPES, formatMoney, labelize } from '../../../data/propertyOptions';
import { PRICE_BANDS, compactMoney, priceBandQuery, toLatLng } from '../../../utils/listing';

const toOptions = (values) => values.map((v) => ({ value: v, label: labelize(v) }));
const BEDROOMS = [
  { value: '0', label: 'Studio' },
  ...[1, 2, 3, 4].map((n) => ({ value: String(n), label: `${n}+ bedrooms` })),
];
const SORTS = [
  { value: '', label: 'Featured first' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
];
const ADVANCED = ['schemeType', 'availability'];
const getCoords = (p) => toLatLng(p.location);
const getLabel = (p) => compactMoney(p.searchSnapshot?.fullMarketValue) || 'View';

function MapPopup({ property }) {
  const snap = property.searchSnapshot || {};
  return (
    <Link to={`/properties/${property._id}`} className="block w-52 !text-inherit no-underline">
      {snap.primaryImageUrl && <img src={snap.primaryImageUrl} alt="" className="w-full h-24 object-cover rounded-md mb-2" />}
      <p className="font-bold text-sm text-ink leading-snug">{property.name}</p>
      <p className="text-xs text-gray-500 mt-0.5">{property.address?.townCity || property.address?.postcode}</p>
      <p className="text-sm font-extrabold text-brand-600 mt-1">{snap.fullMarketValue ? formatMoney(snap.fullMarketValue) : 'POA'}</p>
    </Link>
  );
}

export default function PropertiesPage() {
  const list = useListParams({
    filters: ['propertyType', 'price', 'bedrooms', ...ADVANCED, 'sort', 'view'],
    defaultLimit: 12,
  });
  const { filters, setFilter } = list;
  const advancedCount = ADVANCED.filter((key) => filters[key]).length;
  const [showAdvanced, setShowAdvanced] = useState(advancedCount > 0);

  const apiQuery = useMemo(() => {
    const { price, ...rest } = list.query;
    delete rest.view;
    return { ...rest, ...priceBandQuery(price) };
  }, [list.query]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['public', 'properties', apiQuery],
    queryFn: () => commonApi.getProperties(apiQuery).then((r) => r.data.data),
    placeholderData: keepPreviousData,
  });
  const items = data?.items || [];
  const total = data?.pagination?.total ?? 0;

  const toolbar = (
    <>
      <label className="relative w-full sm:w-72">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="search"
          value={list.search}
          onChange={(e) => list.setSearch(e.target.value)}
          placeholder="Town, postcode or development…"
          className="w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
      </label>
      <Dropdown aria-label="Property type" icon={Home} value={filters.propertyType} onChange={(v) => setFilter('propertyType', v)} placeholder="All types" options={toOptions(PROPERTY_TYPES)} className="w-[calc(50%-5px)] sm:w-44" />
      <Dropdown aria-label="Price range" icon={PoundSterling} value={filters.price} onChange={(v) => setFilter('price', v)} placeholder="Any price" options={PRICE_BANDS} className="w-[calc(50%-5px)] sm:w-48" />
      <Dropdown aria-label="Bedrooms" icon={BedDouble} value={filters.bedrooms} onChange={(v) => setFilter('bedrooms', v)} placeholder="Any beds" options={BEDROOMS} className="w-[calc(50%-5px)] sm:w-40" />
      <button
        type="button"
        onClick={() => setShowAdvanced((v) => !v)}
        aria-expanded={showAdvanced}
        className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-sm font-medium transition-colors ${
          showAdvanced || advancedCount ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-gray-200 bg-white text-gray-700 hover:border-brand-300'
        }`}
      >
        <SlidersHorizontal className="w-4 h-4" /> Advanced filters
        {advancedCount > 0 && <span className="rounded-full bg-brand-500 px-1.5 text-[10px] font-bold text-white">{advancedCount}</span>}
      </button>
      {list.hasFilters && (
        <button type="button" onClick={list.clear} className="inline-flex items-center gap-1 px-2 py-2.5 text-sm font-medium text-red-600 hover:text-red-700">
          <X className="w-4 h-4" /> Clear
        </button>
      )}
    </>
  );

  const advanced = showAdvanced && (
    <div className="px-4 sm:px-6 py-3 flex flex-wrap items-center gap-2.5">
      <span className="text-xs font-bold uppercase tracking-wider text-gray-500 mr-1">Refine</span>
      <Dropdown aria-label="Scheme" value={filters.schemeType} onChange={(v) => setFilter('schemeType', v)} placeholder="All schemes" options={toOptions(SCHEME_TYPES)} className="w-full sm:w-72" />
      <Dropdown aria-label="Availability" value={filters.availability} onChange={(v) => setFilter('availability', v)} placeholder="Any availability" options={toOptions(AVAILABILITY)} className="w-full sm:w-52" />
    </div>
  );

  return (
    <ListingBrowser
      title="All Properties"
      subtitle="Discover shared ownership and affordable homes for sale across the UK"
      toolbar={toolbar}
      advanced={advanced}
      count={total}
      noun={total === 1 ? 'property' : 'properties'}
      heading="Available Shared Ownership Homes"
      subheading="Verified listings from housing providers and private sellers"
      sort={{ value: filters.sort, onChange: (v) => setFilter('sort', v), options: SORTS }}
      view={filters.view || 'split'}
      setView={(v) => setFilter('view', v === 'split' ? '' : v)}
      loading={isLoading}
      fetching={isFetching}
      items={items}
      renderCard={(p, { active, onHover }) => <PropertyCard key={p._id} property={p} active={active} onHover={onHover} />}
      map={{ getCoords, getLabel, renderPopup: (p) => <MapPopup property={p} /> }}
      pagination={data?.pagination}
      onPage={list.setPage}
      empty={(
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white py-20 text-center">
          <SearchX className="w-10 h-10 mx-auto text-gray-300" />
          <p className="mt-3 font-bold text-ink">No homes match your search</p>
          <p className="text-sm text-gray-500 mt-1">Try a wider area, another price range or fewer filters.</p>
          {list.hasFilters && <button type="button" onClick={list.clear} className="btn-brand-outline mt-5">Clear all filters</button>}
        </div>
      )}
    />
  );
}
