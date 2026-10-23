import { LayoutDashboard, Users, HomeIcon, User, Plus, Landmark, UserPlus, MessageCircle } from 'lucide-react';
import DashboardLayout from './DashboardLayout';

const groups = [
  { title: 'General', links: [{ to: '/org-admin', label: 'Dashboard', icon: LayoutDashboard, end: true }] },
  {
    title: 'Team',
    links: [
      { to: '/org-admin/users', label: 'Users', icon: Users },
      { to: '/org-admin/users/new', label: 'Add User', icon: UserPlus },
    ],
  },
  {
    title: 'Properties',
    links: [
      { to: '/org-admin/properties/new', label: 'Create New', icon: Plus },
      { to: '/org-admin/properties', label: 'All Properties', icon: HomeIcon },
    ],
  },
  {
    title: 'Developments',
    links: [
      { to: '/org-admin/developments/new', label: 'Create New', icon: Plus },
      { to: '/org-admin/developments', label: 'All Developments', icon: Landmark },
    ],
  },
  { title: 'Account', links: [
    { to: '/org-admin/messages', label: 'Messages', icon: MessageCircle, chatBadge: true },
    { to: '/org-admin/profile', label: 'My Profile', icon: User },
  ] },
];

export default function OrgAdminLayout() {
  return <DashboardLayout groups={groups} title="Org Admin Dashboard" subtitle="SharedOwnership organisation admin workspace" />;
}
