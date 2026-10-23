import { LayoutDashboard, Users, UserCheck, HomeIcon, Building2, Plus, Landmark, UserPlus, MessageCircle } from 'lucide-react';
import DashboardLayout from './DashboardLayout';

const groups = [
  { title: 'General', links: [{ to: '/org', label: 'Dashboard', icon: LayoutDashboard, end: true }] },
  {
    title: 'Team',
    links: [
      { to: '/org/admins', label: 'Admins', icon: UserCheck },
      { to: '/org/admins/new', label: 'Add Admin', icon: UserPlus },
      { to: '/org/users', label: 'Users', icon: Users },
      { to: '/org/users/new', label: 'Add User', icon: UserPlus },
    ],
  },
  {
    title: 'Properties',
    links: [
      { to: '/org/properties/new', label: 'Create New', icon: Plus },
      { to: '/org/properties', label: 'All Properties', icon: HomeIcon },
    ],
  },
  {
    title: 'Developments',
    links: [
      { to: '/org/developments/new', label: 'Create New', icon: Plus },
      { to: '/org/developments', label: 'All Developments', icon: Landmark },
    ],
  },
  { title: 'Account', links: [
    { to: '/org/messages', label: 'Messages', icon: MessageCircle, chatBadge: true },
    { to: '/org/profile', label: 'Company Profile', icon: Building2 },
  ] },
];

export default function OrgLayout() {
  return <DashboardLayout groups={groups} title="Organisation Dashboard" subtitle="SharedOwnership organisation workspace" />;
}
