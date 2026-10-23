const memberService = require('../../../utils/member.service');
const activityService = require('../../../utils/activity.service');
const { sendMailSafely } = require('../../../utils/email.service');
const memberRemovedEmail = require('../../../emails/memberRemoved');
const { PROFILE_KEY_BY_ROLE } = require('../../../common/roles');
const { isNonEmptyString } = require('../../../utils/validators');
const { findCompany } = require('./adminCompany.service');
const { updateAccount } = require('./adminAccount.service');

/**
 * Inside a company's panel: its admins and its users. Every function takes the
 * member role (organisation-admin or organisation-user), so an id from the
 * other list is treated as not found. `admin` is req.user.
 */

const listMembers = async (companyId, role, query) => {
  const company = await findCompany(companyId);
  return memberService.listMembers(company._id, role, query);
};

const getMember = async (companyId, role, memberId) => {
  const company = await findCompany(companyId);
  const data = await memberService.getMember(company._id, role, memberId);
  const loginIps = await activityService.getLoginIps(data.member._id);
  return { ...data, loginIps };
};

/**
 * Removes the member (see memberService.deleteMember) and emails both the
 * member and the company. Body: { reason? } is included in both emails.
 */
const deleteMember = async (companyId, role, memberId, body = {}) => {
  const company = await findCompany(companyId);
  const member = await memberService.deleteMember(company._id, role, memberId);

  const profile = member[PROFILE_KEY_BY_ROLE[role]] || {};
  const details = {
    memberName: [profile.firstName, profile.lastName].filter(Boolean).join(' ') || member.email,
    memberEmail: member.email,
    roleLabel: memberService.ROLE_LABEL[role],
    organisationName: company.organisationProfile?.name || company.email,
    reason: isNonEmptyString(body?.reason) ? body.reason.trim() : undefined,
  };

  const notifications = await Promise.all([
    sendMailSafely({ to: member.email, ...memberRemovedEmail.toMember(details) }),
    sendMailSafely({ to: company.email, ...memberRemovedEmail.toOrganisation(details) }),
  ]);

  return { member: { _id: member._id, email: member.email, role: member.role }, notifications };
};

/** Body: { isActive?, profile? } */
const updateMember = async (companyId, role, memberId, body) => {
  const company = await findCompany(companyId);
  return updateAccount(await memberService.findMember(company._id, role, memberId), body);
};

/** "Go inside" the member's account, recorded as impersonated by the admin */
const impersonate = async (admin, companyId, role, memberId, client) => {
  const company = await findCompany(companyId);
  return memberService.impersonate(company._id, role, memberId, client, admin.id);
};

const listSessions = async (companyId, role, memberId, query) => {
  const company = await findCompany(companyId);
  return memberService.listSessions(company._id, role, memberId, query);
};

const listSessionActivities = async (companyId, role, memberId, sessionId, query) => {
  const company = await findCompany(companyId);
  return memberService.listSessionActivities(company._id, role, memberId, sessionId, query);
};

module.exports = {
  listMembers,
  getMember,
  deleteMember,
  updateMember,
  impersonate,
  listSessions,
  listSessionActivities,
};
