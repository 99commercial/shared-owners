import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LogOut, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { chatApi } from '../services/endpoints';

const PROFILE_KEYS = ['userProfile', 'organisationAdminProfile', 'organisationUserProfile', 'adminProfile'];

export const getDisplayName = (user, role) => {
  if (!user) return '';
  if (role === 'organisation') return user.organisationProfile?.name || 'Organisation';
  const p = PROFILE_KEYS.map((k) => user[k]).find(Boolean) || {};
  return p.firstName ? `${p.firstName} ${p.lastName || ''}`.trim() : user.email?.split('@')[0] || 'User';
};

const getAvatarUrl = (user) =>
  user?.organisationProfile?.logoUrl || PROFILE_KEYS.map((k) => user?.[k]?.avatarUrl).find(Boolean);

const linkMatches = (link, pathname) =>
  link.end ? pathname === link.to : pathname === link.to || pathname.startsWith(`${link.to}/`);

/** The most specific matching link wins, so /user/properties/new highlights "Create New", not "My Properties" */
const activeLinkTo = (links, pathname) =>
  links
    .filter((l) => linkMatches(l, pathname))
    .sort((a, b) => b.to.length - a.to.length)[0]?.to;

export function Logo({ compact }) {
  if (compact) {
    return (
      <div className="flex rounded overflow-hidden text-[11px] font-black leading-none shadow-sm">
        <span className="bg-ink text-white px-1.5 py-1.5">S</span>
        <span className="bg-brand-500 text-white px-1.5 py-1.5">O</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center">
      <div className="flex rounded-sm overflow-hidden text-[13px] font-black tracking-tight leading-none">
        <span className="bg-ink text-white px-2 py-1.5">SHARED</span>
        <span className="bg-brand-500 text-white px-2 py-1.5">OWNERSHIP</span>
      </div>
      <div className="text-[9px] font-extrabold tracking-[0.12em] text-ink mt-1">PROPERTY MARKETPLACE</div>
    </div>
  );
}

function Avatar({ user, size = 'w-9 h-9' }) {
  const url = getAvatarUrl(user);
  return (
    <div className={`${size} rounded-full bg-gray-300 text-white flex items-center justify-center overflow-hidden shrink-0`}>
      {url ? (
        <img src={url} alt="" className="w-full h-full object-cover" />
      ) : (
        <svg viewBox="0 0 24 24" className="w-3/5 h-3/5 fill-current"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" /></svg>
      )}
    </div>
  );
}

function SidebarContent({ groups, collapsed, onNavigate, onClose }) {
  const { user, role, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const links = groups.flatMap((g) => g.links);
  const activeTo = activeLinkTo(links, pathname);
  const showChatBadge = links.some((link) => link.chatBadge);
  const { data: unreadChats = 0 } = useQuery({
    queryKey: ['chat', 'unread'],
    queryFn: () => chatApi.unreadCount().then((r) => r.data.data.count),
    enabled: showChatBadge,
    refetchInterval: 30000,
  });
  const name = getDisplayName(user, role);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className={`relative shrink-0 flex items-center h-16 border-b border-gray-200 ${collapsed ? 'justify-center' : 'justify-center px-5'}`}>
        <Link to="/" title="SharedOwnership"><Logo compact={collapsed} /></Link>
        {onClose && (
          <button onClick={onClose} className="absolute right-4 p-1.5 rounded-lg text-gray-500 hover:bg-gray-100" aria-label="Close sidebar">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className={`flex-1 overflow-y-auto py-6 space-y-7 ${collapsed ? 'px-3' : 'px-4'}`}>
        {groups.map((group, gi) => (
          <div key={group.title}>
            {collapsed ? (
              gi > 0 && <div className="mx-2 mb-4 border-t border-gray-100" />
            ) : (
              <div className="px-3 mb-2.5 text-[11px] font-bold tracking-[0.08em] text-gray-400 uppercase">{group.title}</div>
            )}
            <div className="space-y-1">
              {group.links.map((link) => {
                const Icon = link.icon;
                const active = link.to === activeTo;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={onNavigate}
                    title={collapsed ? link.label : undefined}
                    className={`relative flex items-center gap-3.5 rounded-xl text-sm font-medium transition-colors ${
                      collapsed ? 'justify-center h-11' : 'px-3.5 py-2.5'
                    } ${active ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-ink'}`}
                  >
                    {active && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-brand-500" />}
                    <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-brand-500' : 'text-gray-400'}`} />
                    {!collapsed && <span className="truncate">{link.label}</span>}
                    {(link.chatBadge ? unreadChats : link.badge) > 0 && (collapsed ? (
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500" />
                    ) : (
                      <span className="ml-auto min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">
                        {(link.chatBadge ? unreadChats : link.badge) > 99 ? '99+' : (link.chatBadge ? unreadChats : link.badge)}
                      </span>
                    ))}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className={`shrink-0 border-t border-gray-100 ${collapsed ? 'px-3 py-5' : 'p-4 pb-5'}`}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-3">
            <div title={name}><Avatar user={user} size="w-10 h-10" /></div>
            <button
              onClick={handleLogout}
              title="Logout"
              aria-label="Logout"
              className="flex items-center justify-center w-10 h-10 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-[18px] h-[18px]" />
            </button>
          </div>
        ) : (
          <div className="rounded-2xl bg-gray-50 border border-gray-100 p-3">
            <div className="flex items-center gap-3 px-1">
              <Avatar user={user} size="w-10 h-10" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-ink truncate">{name}</div>
                <div className="text-xs text-gray-500 capitalize truncate">{role?.replace(/-/g, ' ')}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl bg-white border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Desktop: sticky rail that collapses to icons (toggled from the top bar). Mobile: off-canvas drawer.
 * `groups` = [{ title, links: [{ to, label, icon, end?, badge? }] }]
 */
export default function Sidebar({ groups, collapsed, mobileOpen, onMobileClose }) {
  return (
    <>
      <aside
        className={`hidden lg:block sticky top-0 h-screen shrink-0 border-r border-gray-200 transition-[width] duration-200 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <SidebarContent groups={groups} collapsed={collapsed} />
      </aside>

      <div
        onClick={onMobileClose}
        className={`lg:hidden fixed inset-0 z-40 bg-gray-900/40 transition-opacity ${mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] shadow-xl transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!mobileOpen}
      >
        <SidebarContent groups={groups} collapsed={false} onNavigate={onMobileClose} onClose={onMobileClose} />
      </aside>
    </>
  );
}
