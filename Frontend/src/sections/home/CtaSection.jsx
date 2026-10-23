import { Link } from 'react-router-dom';
import { Shield, ArrowRight } from 'lucide-react';

export default function CtaSection() {
  return (
    <section className="py-20 bg-primary-600">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Shield className="w-12 h-12 text-white/60 mx-auto mb-6" />
        <h2 className="text-3xl font-bold text-white mb-4">Ready to list your properties?</h2>
        <p className="text-blue-100 mb-8 text-lg">Join hundreds of housing providers already using SharedOwnership to reach buyers.</p>
        <Link to="/register" className="inline-flex items-center gap-2 bg-white text-primary-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-blue-50 transition-colors shadow-lg">
          Register as Organisation <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </section>
  );
}
