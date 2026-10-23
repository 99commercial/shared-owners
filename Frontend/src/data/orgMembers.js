import { UserCheck, Users } from 'lucide-react';
import { orgApi, orgAdminApi } from '../services/endpoints';

/** Status filter value → query params for the member list endpoints */
export const MEMBER_STATUS_QUERY = {
  active: { isActive: 'true', isVerified: 'true' },
  pending: { isVerified: 'false' },
  deactivated: { isActive: 'false' },
};

const ADMIN_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'deactivated', label: 'Deactivated' },
];

const USER_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending approval' },
  { value: 'deactivated', label: 'Deactivated' },
];

/**
 * Member lists share one table and one create form; this is what differs.
 * `remove` / `approve` are left out where the role's API has no such route.
 * `assignAdmin` lets the creator pick the user's managing admin.
 */
export const ORG_MEMBER_TYPES = Object.freeze({
  admins: {
    singular: 'Admin',
    plural: 'Admins',
    title: 'Organisation Admins',
    subtitle: 'Admins can manage users and listings on behalf of your organisation',
    createSubtitle: 'Admins can add users, approve sign-ups and manage every listing and development',
    icon: UserCheck,
    homePath: '/org',
    path: '/org/admins',
    profileKey: 'organisationAdminProfile',
    queryKey: ['org', 'admins'],
    dashboardKey: ['org', 'dashboard'],
    list: orgApi.getAdmins,
    create: orgApi.createAdmin,
    remove: orgApi.removeAdmin,
    statuses: ADMIN_STATUSES,
  },
  users: {
    singular: 'User',
    plural: 'Users',
    title: 'Organisation Users',
    subtitle: 'Team members who create and look after your listings',
    createSubtitle: 'Users create and edit the listings and developments they own or are assigned to',
    icon: Users,
    homePath: '/org',
    path: '/org/users',
    profileKey: 'organisationUserProfile',
    queryKey: ['org', 'users'],
    dashboardKey: ['org', 'dashboard'],
    list: orgApi.getUsers,
    create: orgApi.createUser,
    remove: orgApi.removeUser,
    approve: orgApi.approveUser,
    assignAdmin: { list: orgApi.getAdmins, queryKey: ['org', 'admins', 'options'] },
    statuses: USER_STATUSES,
  },
  orgAdminUsers: {
    singular: 'User',
    plural: 'Users',
    title: 'Organisation Users',
    subtitle: "Your organisation's team members. Users you add are managed by you",
    createSubtitle: 'Users create and edit the listings and developments they own or are assigned to. You become their managing admin',
    icon: Users,
    homePath: '/org-admin',
    path: '/org-admin/users',
    profileKey: 'organisationUserProfile',
    queryKey: ['org-admin', 'users'],
    dashboardKey: ['org-admin', 'dashboard'],
    list: orgAdminApi.getUsers,
    create: orgAdminApi.createUser,
    approve: orgAdminApi.approveUser,
    statuses: USER_STATUSES,
  },
});
