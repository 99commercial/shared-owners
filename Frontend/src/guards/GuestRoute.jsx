import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_REDIRECTS } from '../data/constants';

export default function GuestRoute({ children }) {
  const { user, role, loading } = useAuth();
  if (loading) return null;
  if (user) {
    return <Navigate to={ROLE_REDIRECTS[role] || '/'} replace />;
  }
  return children;
}
