import { Loader2 } from 'lucide-react';
import useUserDashboard from '../../../hooks/useUserDashboard';
import DashboardStats from '../../../sections/user/DashboardStats';
import DashboardBreakdown from '../../../sections/user/DashboardBreakdown';
import DashboardPropertyLists from '../../../sections/user/DashboardPropertyLists';

export default function UserDashboardPage() {
  const { data, isLoading, error } = useUserDashboard();
  const analytics = data?.properties;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
      ) : error ? (
        <div className="dash-card p-8 text-center text-sm text-red-600">{error.response?.data?.message || 'Could not load your dashboard'}</div>
      ) : (
        <>
          <DashboardStats analytics={analytics} />
          <DashboardBreakdown analytics={analytics} />
          <DashboardPropertyLists analytics={analytics} />
        </>
      )}
    </div>
  );
}
