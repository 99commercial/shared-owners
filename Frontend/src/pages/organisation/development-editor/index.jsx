import OwnerDevelopmentEditor from '../../../sections/development/OwnerDevelopmentEditor';
import { PROPERTY_OWNERS } from '../../../data/propertyOwners';

export default function OrgDevelopmentEditorPage() {
  return <div className="p-4 sm:p-6 lg:p-8"><OwnerDevelopmentEditor owner={PROPERTY_OWNERS.organisation} /></div>;
}
