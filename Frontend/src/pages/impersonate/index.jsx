import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Loader2, ShieldAlert } from 'lucide-react';
import authStorage from '../../services/authStorage';
import { useAuth, ROLE_PATHS } from '../../contexts/AuthContext';

/** Landing page of a tab opened by an admin's "Open account" button */
export default function ImpersonatePage() {
  const { key } = useParams();
  const { loadUser } = useAuth();
  const navigate = useNavigate();
  const started = useRef(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const role = authStorage.claimHandoff(key) || authStorage.getImpersonation()?.role;
    if (!role) {
      setFailed(true);
      return;
    }
    loadUser().then(() => navigate(ROLE_PATHS[role] || '/', { replace: true }));
  }, [key, loadUser, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="dash-card p-8 max-w-sm w-full text-center">
        {failed ? (
          <>
            <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <h1 className="text-lg font-bold text-ink">This link has expired</h1>
            <p className="text-sm text-gray-500 mt-1">Go back to the admin panel and click “Open account” again.</p>
            <Link to="/login" className="btn-brand mt-5">Back to the panel</Link>
          </>
        ) : (
          <>
            <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto mb-3" />
            <p className="text-sm text-gray-600">Opening account…</p>
          </>
        )}
      </div>
    </div>
  );
}
