import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { orgAdminApi } from '../../../services/endpoints';
import DashboardStats from '../../../sections/organisation/DashboardStats';
import DashboardTeam from '../../../sections/organisation/DashboardTeam';
import DashboardBreakdown from '../../../sections/user/DashboardBreakdown';
import DashboardPropertyLists from '../../../sections/user/DashboardPropertyLists';

const BASE = '/org-admin';

export default function OrgAdminDashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['org-admin-dashboard'],
    queryFn: () => orgAdminApi.getDashboard().then((r) => r.data.data),
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
      ) : error ? (
        <div className="dash-card p-8 text-center text-sm text-red-600">{error.response?.data?.message || 'Could not load your dashboard'}</div>
      ) : (
        <>
          <DashboardStats dashboard={data} basePath={BASE} />
          <DashboardBreakdown analytics={data?.properties} basePath={BASE} />
          <DashboardTeam dashboard={data} basePath={BASE} />
          <DashboardPropertyLists analytics={data?.properties} basePath={BASE} />
        </>
      )}
    </div>
  );
}
