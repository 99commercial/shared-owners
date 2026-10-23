import { Link } from 'react-router-dom';
import { MapPin, Building2, ArrowRight } from 'lucide-react';

const MOCK_DEVELOPMENTS = [
  { id: 1, name: 'Riverside Quarter', location: 'Stratford, London', units: 120, type: 'Mixed Use' },
  { id: 2, name: 'Green Park Place', location: 'Reading, Berkshire', units: 85, type: 'Residential' },
  { id: 3, name: 'Harbour View', location: 'Bristol BS3', units: 64, type: 'Waterfront' },
  { id: 4, name: 'The Oaks', location: 'Croydon, Surrey', units: 200, type: 'Urban' },
  { id: 5, name: 'Northern Quarter', location: 'Manchester M4', units: 150, type: 'City Centre' },
];

const COLORS = ['bg-blue-100', 'bg-purple-100', 'bg-green-100', 'bg-amber-100', 'bg-rose-100', 'bg-cyan-100'];

function DevelopmentCard({ dev, idx }) {
  return (
    <div className="flex-shrink-0 w-72 card p-0 overflow-hidden hover:shadow-md transition-shadow group">
      <div className={`h-44 ${COLORS[(idx + 2) % COLORS.length]} flex items-center justify-center`}>
        <Building2 className="w-12 h-12 text-gray-400 group-hover:text-gray-600 transition-colors" />
      </div>
      <div className="p-4">
        <h4 className="font-semibold text-gray-900">{dev.name}</h4>
        <div className="flex items-center gap-1 mt-1">
          <MapPin className="w-3 h-3 text-gray-400" />
          <span className="text-xs text-gray-500">{dev.location}</span>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <span className="badge bg-blue-100 text-blue-700">{dev.type}</span>
          <span className="text-xs text-gray-500">{dev.units} units</span>
        </div>
      </div>
    </div>
  );
}

export default function DevelopmentsScroll() {
  const items = [...MOCK_DEVELOPMENTS, ...MOCK_DEVELOPMENTS];
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">New Developments</h2>
            <p className="text-gray-500 text-sm mt-1">Exciting new projects coming soon</p>
          </div>
          <Link to="/developments" className="flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
      <div className="overflow-hidden">
        <div className="flex gap-5 scroll-left-slow" style={{ width: 'max-content' }}>
          {items.map((d, i) => <DevelopmentCard key={`${d.id}-${i}`} dev={d} idx={i} />)}
        </div>
      </div>
    </section>
  );
}
