import { Loader2 } from 'lucide-react';
import { useOrgDashboard } from '../../../hooks/useOrgProfile';
import DashboardStats from '../../../sections/organisation/DashboardStats';
import DashboardTeam from '../../../sections/organisation/DashboardTeam';
import DashboardBreakdown from '../../../sections/user/DashboardBreakdown';
import DashboardPropertyLists from '../../../sections/user/DashboardPropertyLists';

export default function OrgDashboardPage() {
  const { data, isLoading, error } = useOrgDashboard();

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
      ) : error ? (
        <div className="dash-card p-8 text-center text-sm text-red-600">{error.response?.data?.message || 'Could not load your dashboard'}</div>
      ) : (
        <>
          <DashboardStats dashboard={data} />
          <DashboardBreakdown analytics={data?.properties} basePath="/org" />
          <DashboardTeam dashboard={data} />
          <DashboardPropertyLists analytics={data?.properties} basePath="/org" />
        </>
      )}
    </div>
  );
}
