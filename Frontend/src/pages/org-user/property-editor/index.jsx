import OwnerPropertyEditor from '../../../sections/property/OwnerPropertyEditor';
import { PROPERTY_OWNERS } from '../../../data/propertyOwners';

export default function OrgUserPropertyEditorPage() {
  return <div className="p-4 sm:p-6 lg:p-8"><OwnerPropertyEditor owner={PROPERTY_OWNERS.orgUser} /></div>;
}
