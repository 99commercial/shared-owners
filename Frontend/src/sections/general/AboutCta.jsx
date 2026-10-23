import { Link } from 'react-router-dom';
import { Users, ArrowRight } from 'lucide-react';

export default function AboutCta() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Users className="w-12 h-12 text-primary-600 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Join our community</h2>
        <p className="text-gray-500 mb-8">Whether you're a buyer or a housing provider, there's a place for you at SharedOwnership.</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/properties" className="btn-primary flex items-center gap-2">
            Browse Properties <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/register" className="btn-secondary flex items-center gap-2">
            List Your Properties <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
