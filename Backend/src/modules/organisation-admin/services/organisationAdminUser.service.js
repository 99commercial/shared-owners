const memberService = require('../../../utils/member.service');
const { ROLES } = require('../../../common/roles');

/**
 * An organisation admin can create, approve (self-registered) and impersonate
 * the organisation's users, and view them (list, profile, sessions, activities)
 * to find who to act as.
 * Admins cannot delete users or manage other admins.
 * `admin` is req.user: { id, organisationId }.
 */
const USER_ROLE = ROLES.ORGANISATION_USER;

const createUser = (admin, payload) =>
  memberService.createMember(admin.organisationId, USER_ROLE, payload, { assignedBy: admin.id });

const listUsers = (admin, query) => memberService.listMembers(admin.organisationId, USER_ROLE, query);

const getUser = (admin, userId) => memberService.getMember(admin.organisationId, USER_ROLE, userId);

const approveUser = (admin, userId) =>
  memberService.approveMember(admin.organisationId, USER_ROLE, userId, { approvedBy: admin.id });

const impersonateUser = (admin, userId, client) =>
  memberService.impersonate(admin.organisationId, USER_ROLE, userId, client, admin.id);

const listSessions = (admin, userId, query) =>
  memberService.listSessions(admin.organisationId, USER_ROLE, userId, query);

const listSessionActivities = (admin, userId, sessionId, query) =>
  memberService.listSessionActivities(admin.organisationId, USER_ROLE, userId, sessionId, query);

module.exports = {
  createUser,
  listUsers,
  getUser,
  approveUser,
  impersonateUser,
  listSessions,
  listSessionActivities,
};
