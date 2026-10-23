import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, MapPin, Search, Loader2 } from 'lucide-react';
import { commonApi } from '../../../services/endpoints';
import Dropdown from '../../../components/Dropdown';

const TYPE_LABELS = { housing_association: 'Housing Association', developer: 'Developer', landlord: 'Landlord', agent: 'Agent' };
const TYPE_OPTIONS = Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }));
const TYPE_COLORS = { housing_association: 'bg-blue-100 text-blue-700', developer: 'bg-purple-100 text-purple-700', landlord: 'bg-green-100 text-green-700', agent: 'bg-amber-100 text-amber-700' };
const COLORS = ['bg-blue-50', 'bg-purple-50', 'bg-green-50', 'bg-amber-50', 'bg-rose-50', 'bg-cyan-50'];

export default function CompaniesPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['public-organisations', search, typeFilter],
    queryFn: () => commonApi.getOrganisations({ search: search || undefined, type: typeFilter || undefined, limit: 50 }).then(r => r.data.data),
  });

  const organisations = data?.items || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Housing Providers</h1>
        <p className="text-gray-500 mt-2">Trusted organisations listing shared ownership properties</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search organisations…" value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-9 text-sm" />
        </div>
        <Dropdown
          aria-label="Organisation type"
          value={typeFilter}
          onChange={setTypeFilter}
          placeholder="All types"
          options={TYPE_OPTIONS}
          className="sm:w-56"
        />
        <span className="self-center text-sm text-gray-500">{data?.pagination?.total ?? 0} organisations</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {organisations.map((org, idx) => {
            const p = org.organisationProfile || {};
            return (
              <Link key={org._id} to={`/companies/${p.slug}`} className="card p-6 hover:shadow-md transition-all hover:border-primary-200 group block">
                <div className={`w-14 h-14 ${COLORS[idx % COLORS.length]} rounded-xl flex items-center justify-center mb-4`}>
                  {p.logoUrl
                    ? <img src={p.logoUrl} alt={p.name} className="w-10 h-10 object-contain rounded-lg" />
                    : <Building2 className="w-7 h-7 text-gray-400 group-hover:text-primary-500 transition-colors" />}
                </div>
                <h3 className="font-bold text-gray-900 group-hover:text-primary-700 transition-colors">{p.name}</h3>
                {p.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{p.description}</p>}
                <div className="flex items-center justify-between mt-4">
                  {p.type && <span className={`badge ${TYPE_COLORS[p.type] || 'bg-gray-100 text-gray-600'}`}>{TYPE_LABELS[p.type] || p.type}</span>}
                </div>
                {p.address?.city && (
                  <div className="flex items-center gap-1 mt-3 text-xs text-gray-400">
                    <MapPin className="w-3 h-3" /> {p.address.city}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {!isLoading && organisations.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No organisations found</p>
        </div>
      )}
    </div>
  );
}
