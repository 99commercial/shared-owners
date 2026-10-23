import OwnerPropertiesTable from '../../../sections/property/OwnerPropertiesTable';
import { PROPERTY_OWNERS } from '../../../data/propertyOwners';

export default function OrgAdminPropertiesPage() {
  return <div className="p-4 sm:p-6 lg:p-8"><OwnerPropertiesTable owner={PROPERTY_OWNERS.orgAdmin} /></div>;
}
