import { Link } from 'react-router-dom';
import { Building2, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="bg-primary-600 rounded-lg p-1.5">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-white">SharedOwnership</span>
            </Link>
            <p className="text-sm leading-relaxed">Your trusted platform for shared ownership properties across the UK.</p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Explore</h4>
            <ul className="space-y-2.5">
              {[['Properties', '/properties'], ['Developments', '/developments'], ['Companies', '/companies']].map(([label, to]) => (
                <li key={to}><Link to={to} className="text-sm hover:text-white transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Company</h4>
            <ul className="space-y-2.5">
              {[['About Us', '/about'], ['Contact', '/contact'], ['Register', '/register']].map(([label, to]) => (
                <li key={to}><Link to={to} className="text-sm hover:text-white transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Contact</h4>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-primary-500" /> hello@sharedownership.co.uk</li>
              <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-primary-500" /> 0800 123 4567</li>
              <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary-500" /> London, UK</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm">© {new Date().getFullYear()} SharedOwnership. All rights reserved.</p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
