import { Link } from 'react-router-dom';
import { Search, Star, ArrowRight } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-primary-700 via-primary-600 to-blue-700 text-white pt-20 pb-28 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-10 w-96 h-96 bg-blue-300 rounded-full blur-3xl" />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Star className="w-4 h-4 text-yellow-300" /> The UK's #1 Shared Ownership Platform
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold leading-tight mb-6">
            Find your<br />perfect shared<br />
            <span className="text-yellow-300">ownership home</span>
          </h1>
          <p className="text-lg text-blue-100 mb-10 max-w-xl">
            Explore thousands of shared ownership properties and developments from trusted housing providers across the UK.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/properties" className="inline-flex items-center gap-2 bg-white text-primary-700 font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors shadow-lg">
              <Search className="w-5 h-5" /> Browse Properties
            </Link>
            <Link to="/register" className="inline-flex items-center gap-2 bg-primary-500/40 backdrop-blur text-white font-semibold px-6 py-3 rounded-xl border border-white/30 hover:bg-primary-500/60 transition-colors">
              List Your Property <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
