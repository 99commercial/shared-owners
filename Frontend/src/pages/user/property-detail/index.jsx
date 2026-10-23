import OwnerPropertyEditor from '../../../sections/property/OwnerPropertyEditor';
import { PROPERTY_OWNERS } from '../../../data/propertyOwners';

export default function UserPropertyDetailPage() {
  return <div className="p-4 sm:p-6 lg:p-8"><OwnerPropertyEditor owner={PROPERTY_OWNERS.user} /></div>;
}
