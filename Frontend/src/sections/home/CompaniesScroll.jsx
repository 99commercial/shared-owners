import { Link } from 'react-router-dom';
import { Building2, ArrowRight } from 'lucide-react';

const MOCK_COMPANIES = [
  { id: 1, name: 'L&Q Housing', type: 'Housing Association', properties: 2400, slug: 'lq-housing' },
  { id: 2, name: 'Clarion Housing', type: 'Housing Association', properties: 1800, slug: 'clarion-housing' },
  { id: 3, name: 'Peabody Trust', type: 'Housing Association', properties: 980, slug: 'peabody-trust' },
  { id: 4, name: 'Network Homes', type: 'Developer', properties: 640, slug: 'network-homes' },
  { id: 5, name: 'Southern Housing', type: 'Landlord', properties: 1200, slug: 'southern-housing' },
  { id: 6, name: 'Notting Hill Genesis', type: 'Housing Association', properties: 890, slug: 'nhg' },
];

const COLORS = ['bg-blue-50', 'bg-purple-50', 'bg-green-50', 'bg-amber-50', 'bg-rose-50', 'bg-cyan-50'];

function CompanyCard({ company, idx }) {
  return (
    <Link to={`/companies/${company.slug}`} className="flex-shrink-0 w-56 card p-5 hover:shadow-md transition-shadow hover:border-primary-200 block">
      <div className={`w-12 h-12 ${COLORS[(idx + 1) % COLORS.length]} rounded-xl flex items-center justify-center mb-3`}>
        <Building2 className="w-6 h-6 text-gray-500" />
      </div>
      <h4 className="font-semibold text-sm text-gray-900">{company.name}</h4>
      <p className="text-xs text-gray-500 mt-0.5">{company.type}</p>
      <p className="text-xs font-medium text-primary-600 mt-2">{company.properties.toLocaleString()} properties</p>
    </Link>
  );
}

export default function CompaniesScroll() {
  const items = [...MOCK_COMPANIES, ...MOCK_COMPANIES];
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Trusted Providers</h2>
            <p className="text-gray-500 text-sm mt-1">Housing associations, developers, and landlords</p>
          </div>
          <Link to="/companies" className="flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
      <div className="overflow-hidden">
        <div className="flex gap-5 scroll-left" style={{ width: 'max-content' }}>
          {items.map((c, i) => <CompanyCard key={`${c.id}-${i}`} company={c} idx={i} />)}
        </div>
      </div>
    </section>
  );
}
