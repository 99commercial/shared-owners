import MembersTable from '../../../sections/organisation/MembersTable';
import { ORG_MEMBER_TYPES } from '../../../data/orgMembers';

export default function OrgAdminsPage() {
  return <div className="p-4 sm:p-6 lg:p-8"><MembersTable key="admins" type={ORG_MEMBER_TYPES.admins} /></div>;
}
