import { Search, X } from 'lucide-react';
import Dropdown from '../Dropdown';

/** Search box + dropdown filters above a table. filters = [{ key, value, onChange, options, placeholder }] */
export default function ListToolbar({ search, onSearch, placeholder = 'Search…', filters = [], hasFilters, onClear, children }) {
  return (
    <div className="flex flex-col md:flex-row gap-3">
      <div className="relative flex-1 has-icon">
        <Search className="w-4 h-4 text-brand-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input value={search} onChange={(e) => onSearch(e.target.value)} placeholder={placeholder} className="dash-input" />
      </div>
      {filters.map((f) => (
        <Dropdown
          key={f.key}
          aria-label={f.placeholder}
          value={f.value}
          onChange={f.onChange}
          placeholder={f.placeholder}
          options={f.options}
          className={f.className || 'md:w-48'}
        />
      ))}
      {children}
      {hasFilters && (
        <button type="button" onClick={onClear} className="btn-brand-outline shrink-0">
          <X className="w-4 h-4" /> Clear
        </button>
      )}
    </div>
  );
}
