import { Link } from 'react-router-dom';
import { MapPin, Home, ArrowRight } from 'lucide-react';

const MOCK_PROPERTIES = [
  { id: 1, name: '2 Bed Flat, Canary Wharf', price: '£320,000', share: '25%', location: 'London E14', type: 'flat' },
  { id: 2, name: '3 Bed House, Bristol', price: '£240,000', share: '50%', location: 'Bristol BS1', type: 'house' },
  { id: 3, name: 'Studio, Manchester', price: '£130,000', share: '40%', location: 'Manchester M1', type: 'studio' },
  { id: 4, name: '2 Bed Maisonette, Leeds', price: '£180,000', share: '35%', location: 'Leeds LS1', type: 'maisonette' },
  { id: 5, name: '4 Bed House, Birmingham', price: '£290,000', share: '30%', location: 'Birmingham B1', type: 'house' },
  { id: 6, name: '1 Bed Flat, Liverpool', price: '£155,000', share: '45%', location: 'Liverpool L1', type: 'flat' },
];

const COLORS = ['bg-blue-100', 'bg-purple-100', 'bg-green-100', 'bg-amber-100', 'bg-rose-100', 'bg-cyan-100'];

function PropertyCard({ property, idx }) {
  return (
    <div className="flex-shrink-0 w-64 card p-0 overflow-hidden hover:shadow-md transition-shadow group">
      <div className={`h-36 ${COLORS[idx % COLORS.length]} flex items-center justify-center`}>
        <Home className="w-10 h-10 text-gray-400 group-hover:text-gray-600 transition-colors" />
      </div>
      <div className="p-4">
        <h4 className="font-semibold text-sm text-gray-900 truncate">{property.name}</h4>
        <div className="flex items-center gap-1 mt-1">
          <MapPin className="w-3 h-3 text-gray-400" />
          <span className="text-xs text-gray-500">{property.location}</span>
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-primary-700 font-bold text-sm">{property.price}</span>
          <span className="badge bg-green-100 text-green-700">{property.share} share</span>
        </div>
      </div>
    </div>
  );
}

export default function PropertiesScroll() {
  const items = [...MOCK_PROPERTIES, ...MOCK_PROPERTIES];
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Latest Properties</h2>
            <p className="text-gray-500 text-sm mt-1">New shared ownership homes available now</p>
          </div>
          <Link to="/properties" className="flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
      <div className="overflow-hidden">
        <div className="flex gap-5 scroll-left" style={{ width: 'max-content' }}>
          {items.map((p, i) => <PropertyCard key={`${p.id}-${i}`} property={p} idx={i} />)}
        </div>
      </div>
    </section>
  );
}
