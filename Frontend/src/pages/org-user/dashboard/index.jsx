import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { orgUserApi } from '../../../services/endpoints';
import DashboardStats from '../../../sections/user/DashboardStats';
import DashboardBreakdown from '../../../sections/user/DashboardBreakdown';
import DashboardPropertyLists from '../../../sections/user/DashboardPropertyLists';

const BASE = '/org-user';

export default function OrgUserDashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['org-user-dashboard'],
    queryFn: () => orgUserApi.getDashboard().then((r) => r.data.data),
  });
  const analytics = data?.properties;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
      ) : error ? (
        <div className="dash-card p-8 text-center text-sm text-red-600">{error.response?.data?.message || 'Could not load your dashboard'}</div>
      ) : (
        <>
          <DashboardStats analytics={analytics} basePath={BASE} />
          <DashboardBreakdown analytics={analytics} basePath={BASE} />
          <DashboardPropertyLists analytics={analytics} basePath={BASE} />
        </>
      )}
    </div>
  );
}
