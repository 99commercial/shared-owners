import { useCallback } from 'react';
import toast from 'react-hot-toast';
import authStorage from '../services/authStorage';

/**
 * Opens someone else's account in a new tab without signing the admin out.
 * `request` is the impersonate API call. The tab is opened before the request
 * so pop-up blockers treat it as part of the click.
 */
export default function useOpenAccount() {
  return useCallback(async (request, label) => {
    const tab = window.open('about:blank', '_blank');
    if (!tab) {
      toast.error('Allow pop-ups for this site to open accounts in a new tab');
      return;
    }
    tab.document.title = 'Opening account…';
    try {
      const res = await request();
      const { accessToken, refreshToken, user } = res.data.data;
      const key = authStorage.createHandoff({ accessToken, refreshToken, role: user.role, label });
      tab.location.href = `/impersonate/${key}`;
    } catch (err) {
      tab.close();
      toast.error(err.response?.data?.message || 'Could not open this account');
    }
  }, []);
}
