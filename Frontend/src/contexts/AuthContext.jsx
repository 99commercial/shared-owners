import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import authStorage from '../services/authStorage';

const AuthContext = createContext(null);

export const ROLE_PATHS = {
  admin: '/admin',
  organisation: '/org',
  'organisation-admin': '/org-admin',
  'organisation-user': '/org-user',
  user: '/user',
};

const PROFILE_ENDPOINTS = {
  admin: '/admin/profile',
  organisation: '/organisations/profile',
  'organisation-admin': '/organisation-admins/profile',
  'organisation-user': '/organisation-users/profile',
  user: '/users/profile',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = authStorage.getAccessToken();
    const storedRole = authStorage.getRole();
    if (!token || !storedRole) {
      setLoading(false);
      return;
    }
    try {
      const endpoint = PROFILE_ENDPOINTS[storedRole];
      if (!endpoint) throw new Error('Unknown role');
      const res = await api.get(endpoint);
      const data = res.data.data;
      const userData = data.user || data.admin || data.organisation || data.orgAdmin || data.orgUser || Object.values(data)[0];
      setUser(userData);
      setRole(storedRole);
    } catch {
      authStorage.clear();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
    const handleLogout = () => logout();
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, [loadUser]);

  const login = (userData, userRole, tokens) => {
    authStorage.setSession({ ...tokens, role: userRole });
    setUser(userData);
    setRole(userRole);
  };

  const logout = useCallback(async () => {
    try {
      const storedRole = authStorage.getRole();
      const LOGOUT_ENDPOINTS = {
        admin: '/admin/logout',
        organisation: '/organisations/logout',
        'organisation-admin': '/organisation-admins/logout',
        'organisation-user': '/organisation-users/logout',
        user: '/users/logout',
      };
      if (storedRole && LOGOUT_ENDPOINTS[storedRole]) {
        await api.post(LOGOUT_ENDPOINTS[storedRole]).catch(() => {});
      }
    } finally {
      authStorage.clear();
      setUser(null);
      setRole(null);
    }
  }, []);

  const updateUser = (data) => setUser((prev) => ({ ...prev, ...data }));

  return (
    <AuthContext.Provider value={{ user, role, loading, login, logout, updateUser, loadUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
