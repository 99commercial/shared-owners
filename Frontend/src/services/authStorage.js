/**
 * Where the signed-in session's tokens live. Normally localStorage (shared by
 * every tab). A tab opened by an admin to "open" someone else's account keeps
 * that session in its own sessionStorage, so the admin stays signed in
 * everywhere else and closing the tab leaves nothing behind.
 */
const IMPERSONATION_KEY = 'impersonation';
const HANDOFF_PREFIX = 'impersonation-handoff:';
const HANDOFF_MAX_AGE_MS = 60 * 1000;
const KEYS = { access: 'accessToken', refresh: 'refreshToken', role: 'userRole' };

const store = () => (sessionStorage.getItem(IMPERSONATION_KEY) ? sessionStorage : localStorage);

const authStorage = {
  getAccessToken: () => store().getItem(KEYS.access),
  getRefreshToken: () => store().getItem(KEYS.refresh),
  getRole: () => store().getItem(KEYS.role),

  setSession({ accessToken, refreshToken, role }) {
    const s = store();
    s.setItem(KEYS.access, accessToken);
    s.setItem(KEYS.refresh, refreshToken);
    if (role) s.setItem(KEYS.role, role);
  },

  /** Ends this tab's session; an impersonation tab falls back to the admin's own session */
  clear() {
    const s = store();
    Object.values(KEYS).forEach((k) => s.removeItem(k));
    sessionStorage.removeItem(IMPERSONATION_KEY);
  },

  /** { label, role, startedAt } while this tab is showing someone else's account */
  getImpersonation: () => {
    try {
      return JSON.parse(sessionStorage.getItem(IMPERSONATION_KEY) || 'null');
    } catch {
      return null;
    }
  },

  /** Admin tab: parks the impersonation tokens for the new tab to pick up once */
  createHandoff(payload) {
    const key = crypto.randomUUID();
    localStorage.setItem(HANDOFF_PREFIX + key, JSON.stringify({ ...payload, createdAt: Date.now() }));
    return key;
  },

  /** New tab: moves the parked tokens into this tab's sessionStorage. Returns the role or null. */
  claimHandoff(key) {
    const raw = localStorage.getItem(HANDOFF_PREFIX + key);
    localStorage.removeItem(HANDOFF_PREFIX + key);
    if (!raw) return null;
    const { accessToken, refreshToken, role, label, createdAt } = JSON.parse(raw);
    if (!accessToken || Date.now() - createdAt > HANDOFF_MAX_AGE_MS) return null;
    sessionStorage.setItem(IMPERSONATION_KEY, JSON.stringify({ label, role, startedAt: Date.now() }));
    sessionStorage.setItem(KEYS.access, accessToken);
    sessionStorage.setItem(KEYS.refresh, refreshToken);
    sessionStorage.setItem(KEYS.role, role);
    return role;
  },
};

export default authStorage;
