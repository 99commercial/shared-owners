import MembersTable from '../../../sections/organisation/MembersTable';
import { ORG_MEMBER_TYPES } from '../../../data/orgMembers';

export default function OrgUsersPage() {
  return <div className="p-4 sm:p-6 lg:p-8"><MembersTable key="users" type={ORG_MEMBER_TYPES.users} /></div>;
}
