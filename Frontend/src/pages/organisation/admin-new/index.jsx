import CreateMemberForm from '../../../sections/organisation/CreateMemberForm';
import { ORG_MEMBER_TYPES } from '../../../data/orgMembers';

export default function OrgCreateAdminPage() {
  return <div className="p-4 sm:p-6 lg:p-8"><CreateMemberForm type={ORG_MEMBER_TYPES.admins} /></div>;
}
