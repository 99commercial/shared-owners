import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, Building2, ChevronDown, User, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_DASHBOARD } from '../data/constants';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-primary-600 rounded-lg p-1.5">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900">SharedOwnership</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <NavLink to="/properties" className={({isActive}) => `text-sm font-medium transition-colors ${isActive ? 'text-primary-600' : 'text-gray-600 hover:text-gray-900'}`}>Properties</NavLink>
            <NavLink to="/developments" className={({isActive}) => `text-sm font-medium transition-colors ${isActive ? 'text-primary-600' : 'text-gray-600 hover:text-gray-900'}`}>Developments</NavLink>
            <NavLink to="/companies" className={({isActive}) => `text-sm font-medium transition-colors ${isActive ? 'text-primary-600' : 'text-gray-600 hover:text-gray-900'}`}>Companies</NavLink>
            <NavLink to="/blog" className={({isActive}) => `text-sm font-medium transition-colors ${isActive ? 'text-primary-600' : 'text-gray-600 hover:text-gray-900'}`}>Blog</NavLink>
            <NavLink to="/about" className={({isActive}) => `text-sm font-medium transition-colors ${isActive ? 'text-primary-600' : 'text-gray-600 hover:text-gray-900'}`}>About</NavLink>
            <NavLink to="/contact" className={({isActive}) => `text-sm font-medium transition-colors ${isActive ? 'text-primary-600' : 'text-gray-600 hover:text-gray-900'}`}>Contact</NavLink>
          </div>

          {/* Auth */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative group">
                <button className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-gray-50 rounded-lg px-3 py-2">
                  <User className="w-4 h-4" />
                  <span>{getDisplayName(user, role)}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                  <Link to={ROLE_DASHBOARD[role] || '/'} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-t-xl">Dashboard</Link>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-b-xl">Sign out</button>
                </div>
              </div>
            ) : (
              <>
                <Link to="/login" className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <LogIn className="w-4 h-4" /> Sign in
                </Link>
                <Link to="/register" className="btn-primary text-sm">Get started</Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-2">
          {[['/', 'Home'], ['/properties', 'Properties'], ['/developments', 'Developments'], ['/companies', 'Companies'], ['/blog', 'Blog'], ['/about', 'About'], ['/contact', 'Contact']].map(([to, label]) => (
            <Link key={to} to={to} onClick={() => setOpen(false)} className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">{label}</Link>
          ))}
          <div className="border-t border-gray-100 pt-3 mt-3 space-y-2">
            {user ? (
              <>
                <Link to={ROLE_DASHBOARD[role] || '/'} onClick={() => setOpen(false)} className="block px-3 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg">Dashboard</Link>
                <button onClick={() => { setOpen(false); handleLogout(); }} className="w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg">Sign out</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">Sign in</Link>
                <Link to="/register" onClick={() => setOpen(false)} className="block px-3 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg text-center">Get started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

function getDisplayName(user, role) {
  if (!user) return '';
  if (role === 'organisation') return user.organisationProfile?.name || 'Organisation';
  const p = user.userProfile || user.organisationAdminProfile || user.organisationUserProfile || user.adminProfile || {};
  return p.firstName || user.email?.split('@')[0] || 'User';
}
