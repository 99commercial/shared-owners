import { userApi, orgApi, orgAdminApi, orgUserApi } from '../services/endpoints';

/**
 * Who a listing belongs to decides which API and dashboard routes the shared
 * property / development tables and editors use. Query keys are rooted per
 * owner so caches never mix. `canDelete` is false where the backend has no
 * delete route for the role (users of an organisation).
 */
const owner = ({ root, ...rest }) => ({
  hasDevelopments: false,
  canDelete: true,
  ...rest,
  keys: {
    dashboard: [root, 'dashboard'],
    profile: [root, 'profile'],
    list: [root, 'properties'],
    item: (id) => [root, 'property', id],
    developments: [root, 'developments'],
    development: (id) => [root, 'development', id],
  },
});

export const PROPERTY_OWNERS = Object.freeze({
  user: owner({
    root: 'user',
    api: userApi,
    basePath: '/user',
    listTitle: 'My Properties',
    requiresApproval: true,
  }),
  organisation: owner({
    root: 'org',
    api: orgApi,
    basePath: '/org',
    listTitle: 'Properties',
    requiresApproval: false,
    hasDevelopments: true,
  }),
  orgAdmin: owner({
    root: 'org-admin',
    api: orgAdminApi,
    basePath: '/org-admin',
    listTitle: 'Properties',
    requiresApproval: false,
    hasDevelopments: true,
  }),
  orgUser: owner({
    root: 'org-user',
    api: orgUserApi,
    basePath: '/org-user',
    listTitle: 'My Properties',
    requiresApproval: true,
    hasDevelopments: true,
    canDelete: false,
  }),
});
