import axios from 'axios';
import authStorage from './authStorage';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = authStorage.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = authStorage.getRefreshToken();
      if (!refreshToken) {
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(err);
      }
      try {
        const role = authStorage.getRole();
        const refreshPath = getRefreshPath(role);
        const res = await api.post(refreshPath, { refreshToken });
        const { accessToken, refreshToken: newRefresh } = res.data.data;
        authStorage.setSession({ accessToken, refreshToken: newRefresh });
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        authStorage.clear();
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(err);
      }
    }
    return Promise.reject(err);
  }
);

const getRefreshPath = (role) => {
  switch (role) {
    case 'admin': return '/admin/refresh-token';
    case 'organisation': return '/organisations/refresh-token';
    case 'organisation-admin': return '/organisation-admins/refresh-token';
    case 'organisation-user': return '/organisation-users/refresh-token';
    default: return '/users/refresh-token';
  }
};

export default api;
