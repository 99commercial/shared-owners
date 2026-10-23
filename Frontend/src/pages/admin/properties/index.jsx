import { Link } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import PageHero from '../../../components/PageHero';
import PropertiesTable from '../../../sections/admin/listings/PropertiesTable';

export default function AdminPropertiesPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHero
        label="Listings"
        title="Properties"
        subtitle="Every listing from individual users and organisations"
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Properties' }]}
        action={<Link to="/admin/analytics/properties" className="btn-brand-outline bg-white"><BarChart3 className="w-4 h-4" /> Analytics</Link>}
      />
      <PropertiesTable />
    </div>
  );
}
