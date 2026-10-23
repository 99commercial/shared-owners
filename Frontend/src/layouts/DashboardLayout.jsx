import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import ImpersonationBanner from '../components/ImpersonationBanner';

const COLLAPSED_KEY = 'sidebarCollapsed';
const DESKTOP_QUERY = '(min-width: 1024px)';

/** Shared shell for every role's panel; each role layout only supplies its nav groups and titles */
export default function DashboardLayout({ groups, title, subtitle }) {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSED_KEY) === '1');
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapsed = () =>
    setCollapsed((c) => {
      localStorage.setItem(COLLAPSED_KEY, c ? '0' : '1');
      return !c;
    });

  const handleMenuClick = () => {
    if (window.matchMedia(DESKTOP_QUERY).matches) toggleCollapsed();
    else setMobileOpen((o) => !o);
  };

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && setMobileOpen(false);
    const media = window.matchMedia(DESKTOP_QUERY);
    const onResize = () => media.matches && setMobileOpen(false);
    document.addEventListener('keydown', onKey);
    media.addEventListener('change', onResize);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      media.removeEventListener('change', onResize);
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar
        groups={groups}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <ImpersonationBanner />
        <Topbar title={title} subtitle={subtitle} onMenuClick={handleMenuClick} />
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
