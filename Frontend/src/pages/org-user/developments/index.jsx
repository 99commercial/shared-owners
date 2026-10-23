import OwnerDevelopmentsTable from '../../../sections/development/OwnerDevelopmentsTable';
import { PROPERTY_OWNERS } from '../../../data/propertyOwners';

export default function OrgUserDevelopmentsPage() {
  return <div className="p-4 sm:p-6 lg:p-8"><OwnerDevelopmentsTable owner={PROPERTY_OWNERS.orgUser} /></div>;
}
