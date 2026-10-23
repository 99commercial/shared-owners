import { useState } from 'react';
import { Eye, LogOut, Loader2 } from 'lucide-react';
import authStorage from '../services/authStorage';
import { useAuth } from '../contexts/AuthContext';

const ROLE_LABELS = {
  user: 'user',
  organisation: 'organisation',
  'organisation-admin': 'organisation admin',
  'organisation-user': 'organisation user',
};

/** Shown at the top of a tab where an admin is viewing someone else's account */
export default function ImpersonationBanner() {
  const { logout } = useAuth();
  const [leaving, setLeaving] = useState(false);
  const impersonation = authStorage.getImpersonation();
  if (!impersonation) return null;

  const exit = async () => {
    setLeaving(true);
    await logout();
    window.close();
    window.location.assign('/login');
  };

  return (
    <div className="sticky top-0 z-40 bg-amber-400 text-amber-950">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm">
        <div className="flex items-center gap-2 min-w-0">
          <Eye className="w-4 h-4 shrink-0" />
          <span className="truncate">
            Viewing <strong>{impersonation.label || 'this account'}</strong>
            {ROLE_LABELS[impersonation.role] && ` (${ROLE_LABELS[impersonation.role]})`} as a platform admin.
            Everything you do here is recorded against this account.
          </span>
        </div>
        <button
          type="button"
          onClick={exit}
          disabled={leaving}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-950 text-amber-50 text-xs font-bold uppercase tracking-wide hover:bg-black disabled:opacity-60"
        >
          {leaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
          Exit account
        </button>
      </div>
    </div>
  );
}
