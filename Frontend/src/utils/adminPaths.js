const MEMBER_SEGMENTS = { 'organisation-admin': 'admins', 'organisation-user': 'users' };

/** Admin detail page of any account summary ({ _id, role, organisationId }) */
export const adminAccountPath = (account) => {
  if (!account?._id || account.deleted) return undefined;
  if (account.role === 'user') return `/admin/users/${account._id}`;
  if (account.role === 'organisation') return `/admin/companies/${account._id}`;
  const segment = MEMBER_SEGMENTS[account.role];
  return segment && account.organisationId
    ? `/admin/companies/${account.organisationId}/${segment}/${account._id}`
    : undefined;
};

export const adminCompanyPath = (companyId, tab) =>
  `/admin/companies/${companyId}${tab ? `?tab=${tab}` : ''}`;
