import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Search / filters / paging for a table, kept in the URL so links and the back
 * button restore the view. `prefix` namespaces the keys when a page has
 * several tables (e.g. tabs on a company page).
 */
export default function useListParams({ filters = [], defaultLimit = 10, prefix = '' } = {}) {
  const [params, setParams] = useSearchParams();
  const key = (name) => `${prefix}${name}`;
  const urlSearch = params.get(key('search')) || '';
  const [search, setSearch] = useState(urlSearch);

  const page = Number(params.get(key('page'))) || 1;
  const limit = Number(params.get(key('limit'))) || defaultLimit;
  const filterValues = Object.fromEntries(filters.map((f) => [f, params.get(key(f)) || '']));

  const update = (patch) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(patch).forEach(([name, value]) => {
        if (value === '' || value === null || value === undefined) next.delete(key(name));
        else next.set(key(name), String(value));
      });
      if (!('page' in patch)) next.delete(key('page'));
      return next;
    }, { replace: true });

  useEffect(() => {
    if (search.trim() === urlSearch) return undefined;
    const timer = setTimeout(() => update({ search: search.trim() }), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, urlSearch]);

  const query = useMemo(() => ({
    page,
    limit,
    ...(urlSearch && { search: urlSearch }),
    ...Object.fromEntries(Object.entries(filterValues).filter(([, v]) => v !== '')),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [page, limit, urlSearch, JSON.stringify(filterValues)]);

  return {
    query,
    search,
    setSearch,
    filters: filterValues,
    setFilter: (name, value) => update({ [name]: value }),
    page,
    limit,
    setPage: (p) => update({ page: p > 1 ? p : '' }),
    setLimit: (l) => update({ limit: l === defaultLimit ? '' : l }),
    hasFilters: Boolean(urlSearch || search || Object.values(filterValues).some(Boolean)),
    clear: () => {
      setSearch('');
      update(Object.fromEntries(['search', ...filters].map((f) => [f, ''])));
    },
  };
}
