import { Link } from 'react-router-dom';
import { Search, Star, ArrowRight } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="bg-ink text-white pt-20 pb-28 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-20 w-72 h-72 bg-brand-500 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Star className="w-4 h-4 text-brand-500" /> The UK&apos;s #1 Shared Ownership Platform
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold leading-tight mb-6">
            Find your<br />perfect shared<br />
            <span className="text-brand-500">ownership home</span>
          </h1>
          <p className="text-lg text-white/70 mb-10 max-w-xl">
            Explore thousands of shared ownership properties and developments from trusted housing providers across the UK.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/properties" className="inline-flex items-center gap-2 bg-brand-500 text-ink font-semibold px-6 py-3 rounded-xl hover:bg-brand-400 transition-colors shadow-lg">
              <Search className="w-5 h-5" /> Browse Properties
            </Link>
            <Link to="/register" className="inline-flex items-center gap-2 bg-white/10 backdrop-blur text-white font-semibold px-6 py-3 rounded-xl border border-white/30 hover:bg-white/20 transition-colors">
              List Your Property <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
