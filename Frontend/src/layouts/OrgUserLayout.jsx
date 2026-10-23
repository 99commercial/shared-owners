import { LayoutDashboard, HomeIcon, Landmark, User, Plus, MessageCircle } from 'lucide-react';
import DashboardLayout from './DashboardLayout';

const groups = [
  { title: 'General', links: [{ to: '/org-user', label: 'Dashboard', icon: LayoutDashboard, end: true }] },
  {
    title: 'Properties',
    links: [
      { to: '/org-user/properties/new', label: 'Create New', icon: Plus },
      { to: '/org-user/properties', label: 'My Properties', icon: HomeIcon },
    ],
  },
  {
    title: 'Developments',
    links: [
      { to: '/org-user/developments/new', label: 'Create New', icon: Plus },
      { to: '/org-user/developments', label: 'My Developments', icon: Landmark },
    ],
  },
  { title: 'Account', links: [
    { to: '/org-user/messages', label: 'Messages', icon: MessageCircle, chatBadge: true },
    { to: '/org-user/profile', label: 'My Profile', icon: User },
  ] },
];

export default function OrgUserLayout() {
  return <DashboardLayout groups={groups} title="Org User Dashboard" subtitle="SharedOwnership organisation user workspace" />;
}
