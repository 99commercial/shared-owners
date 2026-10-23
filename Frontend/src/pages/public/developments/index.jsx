import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Building2, Search, SearchX, X } from 'lucide-react';
import { commonApi } from '../../../services/endpoints';
import useListParams from '../../../hooks/useListParams';
import Dropdown from '../../../components/Dropdown';
import ListingBrowser from '../../../sections/listing/ListingBrowser';
import DevelopmentCard from '../../../sections/development/DevelopmentCard';
import { DEVELOPMENT_TYPES } from '../../../data/developmentOptions';
import { formatMoney, labelize } from '../../../data/propertyOptions';
import { compactMoney, toLatLng } from '../../../utils/listing';

const SORTS = [
  { value: '', label: 'Featured first' },
  { value: 'name', label: 'Name: A to Z' },
];
const getCoords = (d) => toLatLng(d.location);
const getLabel = (d) => (d.homes?.priceFrom ? `from ${compactMoney(d.homes.priceFrom)}` : d.name.slice(0, 18));

function MapPopup({ development }) {
  const image = development.searchSnapshot?.primaryImageUrl;
  return (
    <Link to={`/developments/${development._id}`} className="block w-52 !text-inherit no-underline">
      {image && <img src={image} alt="" className="w-full h-24 object-cover rounded-md mb-2" />}
      <p className="font-bold text-sm text-ink leading-snug">{development.name}</p>
      <p className="text-xs text-gray-500 mt-0.5">{development.address?.townCity || development.address?.postcode}</p>
      <p className="text-sm font-extrabold text-brand-600 mt-1">
        {development.homes?.priceFrom ? `From ${formatMoney(development.homes.priceFrom)}` : `${development.homes?.homes || 0} homes`}
      </p>
    </Link>
  );
}

export default function DevelopmentsPage() {
  const list = useListParams({ filters: ['developmentType', 'sort', 'view'], defaultLimit: 12 });
  const { filters, setFilter } = list;

  const apiQuery = useMemo(() => {
    const rest = { ...list.query };
    delete rest.view;
    return rest;
  }, [list.query]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['public', 'developments', apiQuery],
    queryFn: () => commonApi.getDevelopments(apiQuery).then((r) => r.data.data),
    placeholderData: keepPreviousData,
  });
  const items = data?.items || [];
  const total = data?.pagination?.total ?? 0;

  const toolbar = (
    <>
      <label className="relative w-full sm:w-80">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="search"
          value={list.search}
          onChange={(e) => list.setSearch(e.target.value)}
          placeholder="Development name, town or postcode…"
          className="w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
      </label>
      <Dropdown
        aria-label="Development type"
        icon={Building2}
        value={filters.developmentType}
        onChange={(v) => setFilter('developmentType', v)}
        placeholder="All types"
        options={DEVELOPMENT_TYPES.map((t) => ({ value: t, label: labelize(t) }))}
        className="w-full sm:w-52"
      />
      {list.hasFilters && (
        <button type="button" onClick={list.clear} className="inline-flex items-center gap-1 px-2 py-2.5 text-sm font-medium text-red-600 hover:text-red-700">
          <X className="w-4 h-4" /> Clear
        </button>
      )}
    </>
  );

  return (
    <ListingBrowser
      title="All Developments"
      subtitle="New-build schemes from housing associations and developers, with every available home in one place"
      toolbar={toolbar}
      count={total}
      noun={total === 1 ? 'development' : 'developments'}
      heading="New Shared Ownership Developments"
      subheading="Browse each scheme's homes, prices, brochures and site plans"
      sort={{ value: filters.sort, onChange: (v) => setFilter('sort', v), options: SORTS }}
      view={filters.view || 'split'}
      setView={(v) => setFilter('view', v === 'split' ? '' : v)}
      loading={isLoading}
      fetching={isFetching}
      items={items}
      renderCard={(d, { active, onHover }) => <DevelopmentCard key={d._id} development={d} active={active} onHover={onHover} />}
      map={{ getCoords, getLabel, renderPopup: (d) => <MapPopup development={d} /> }}
      pagination={data?.pagination}
      onPage={list.setPage}
      empty={(
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white py-20 text-center">
          <SearchX className="w-10 h-10 mx-auto text-gray-300" />
          <p className="mt-3 font-bold text-ink">No developments found</p>
          <p className="text-sm text-gray-500 mt-1">{list.hasFilters ? 'Try another search or development type.' : 'New schemes will appear here as soon as they go live.'}</p>
          {list.hasFilters && <button type="button" onClick={list.clear} className="btn-brand-outline mt-5">Clear all filters</button>}
        </div>
      )}
    />
  );
}
