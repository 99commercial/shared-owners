import { LayoutDashboard, HomeIcon, User, Plus, UserCog, MessageCircle } from 'lucide-react';
import DashboardLayout from './DashboardLayout';

const groups = [
  { title: 'General', links: [{ to: '/user', label: 'Dashboard', icon: LayoutDashboard, end: true }] },
  {
    title: 'User',
    links: [
      { to: '/user/messages', label: 'Messages', icon: MessageCircle, chatBadge: true },
      { to: '/user/profile', label: 'My Profile', icon: User },
      { to: '/user/account', label: 'Edit Profile', icon: UserCog },
    ],
  },
  {
    title: 'Properties',
    links: [
      { to: '/user/properties/new', label: 'Create New', icon: Plus },
      { to: '/user/properties', label: 'My Properties', icon: HomeIcon },
    ],
  },
];

export default function UserLayout() {
  return <DashboardLayout groups={groups} title="User Dashboard" subtitle="SharedOwnership user workspace" />;
}
