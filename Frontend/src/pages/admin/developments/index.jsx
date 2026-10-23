import { Link } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import PageHero from '../../../components/PageHero';
import DevelopmentsTable from '../../../sections/admin/listings/DevelopmentsTable';

export default function AdminDevelopmentsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHero
        label="Listings"
        title="Developments"
        subtitle="Schemes created by organisations"
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Developments' }]}
        action={<Link to="/admin/analytics/developments" className="btn-brand-outline bg-white"><BarChart3 className="w-4 h-4" /> Analytics</Link>}
      />
      <DevelopmentsTable />
    </div>
  );
}
