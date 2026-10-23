const memberService = require('../../../utils/member.service');

/** The organisation account fully manages both its admins and its users */
const createMember = (organisationId, role, payload) =>
  memberService.createMember(organisationId, role, payload);

const listMembers = (organisationId, role, query) =>
  memberService.listMembers(organisationId, role, query);

const getMember = (organisationId, role, memberId) =>
  memberService.getMember(organisationId, role, memberId);

const deleteMember = (organisationId, role, memberId) =>
  memberService.deleteMember(organisationId, role, memberId);

const approveMember = (organisationId, role, memberId) =>
  memberService.approveMember(organisationId, role, memberId);

const impersonate = (organisationId, role, memberId, client) =>
  memberService.impersonate(organisationId, role, memberId, client, organisationId);

const listSessions = (organisationId, role, memberId, query) =>
  memberService.listSessions(organisationId, role, memberId, query);

const listSessionActivities = (organisationId, role, memberId, sessionId, query) =>
  memberService.listSessionActivities(organisationId, role, memberId, sessionId, query);

module.exports = {
  createMember,
  listMembers,
  getMember,
  deleteMember,
  approveMember,
  impersonate,
  listSessions,
  listSessionActivities,
};
