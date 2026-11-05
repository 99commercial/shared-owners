import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_REDIRECTS } from '../data/constants';

export default function GuestRoute({ children }) {
  const { user, role, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }
  if (user) {
    return <Navigate to={ROLE_REDIRECTS[role] || '/'} replace />;
  }
  return children;
}
