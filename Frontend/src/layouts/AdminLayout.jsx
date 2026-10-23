import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard, Users, Building2, HomeIcon, CheckSquare, User, Landmark, UsersRound, BarChart3, PieChart,
  FileText, Inbox,
} from 'lucide-react';
import DashboardLayout from './DashboardLayout';
import { adminApi } from '../services/endpoints';

export default function AdminLayout() {
  const { data } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => adminApi.getDashboard().then((r) => r.data.data),
    refetchInterval: 60_000,
  });

  const groups = [
    { title: 'General', links: [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true }] },
    {
      title: 'Analytics',
      links: [
        { to: '/admin/analytics/accounts', label: 'Accounts', icon: UsersRound },
        { to: '/admin/analytics/properties', label: 'Properties', icon: BarChart3 },
        { to: '/admin/analytics/developments', label: 'Developments', icon: PieChart },
      ],
    },
    {
      title: 'Management',
      links: [
        { to: '/admin/users', label: 'Users', icon: Users },
        { to: '/admin/companies', label: 'Organisations', icon: Building2 },
      ],
    },
    {
      title: 'Listings',
      links: [
        { to: '/admin/properties', label: 'Properties', icon: HomeIcon },
        { to: '/admin/developments', label: 'Developments', icon: Landmark },
        { to: '/admin/approvals', label: 'Approvals', icon: CheckSquare, badge: data?.approvalQueue?.total },
      ],
    },
    {
      title: 'Content',
      links: [
        { to: '/admin/blogs', label: 'Blog', icon: FileText },
        { to: '/admin/queries', label: 'Contact queries', icon: Inbox, badge: data?.content?.contactQueries?.byStatus?.new },
      ],
    },
    { title: 'Account', links: [{ to: '/admin/profile', label: 'My Profile', icon: User }] },
  ];

  return <DashboardLayout groups={groups} title="Admin Dashboard" subtitle="SharedOwnership platform administration" />;
}
