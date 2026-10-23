const ROLES = Object.freeze({
  USER: 'user',
  ORGANISATION: 'organisation',
  ADMIN: 'admin',
  ORGANISATION_ADMIN: 'organisation-admin',
  ORGANISATION_USER: 'organisation-user',
});

const ROLE_VALUES = Object.freeze(Object.values(ROLES));

/** Roles that belong to an organisation account */
const ORG_MEMBER_ROLES = Object.freeze([
  ROLES.ORGANISATION_ADMIN,
  ROLES.ORGANISATION_USER,
]);

/** Roles allowed to sign up via the public register endpoint */
const SELF_REGISTER_ROLES = Object.freeze([
  ROLES.USER,
  ROLES.ORGANISATION,
]);

const PROFILE_KEY_BY_ROLE = Object.freeze({
  [ROLES.USER]: 'userProfile',
  [ROLES.ORGANISATION]: 'organisationProfile',
  [ROLES.ORGANISATION_ADMIN]: 'organisationAdminProfile',
  [ROLES.ORGANISATION_USER]: 'organisationUserProfile',
  [ROLES.ADMIN]: 'adminProfile',
});

module.exports = {
  ROLES,
  ROLE_VALUES,
  ORG_MEMBER_ROLES,
  SELF_REGISTER_ROLES,
  PROFILE_KEY_BY_ROLE,
};
