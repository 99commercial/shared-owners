const User = require('../models/User');
const UserSession = require('../models/UserSession');
const { Property } = require('../models/property');
const { Development } = require('../models/development');
const ApiError = require('./ApiError');
const { ROLES, PROFILE_KEY_BY_ROLE } = require('../common/roles');
const { SESSION_END_REASONS } = require('../common/sessionOptions');
const {
  MIN_PASSWORD_LENGTH,
  isNonEmptyString,
  isValidEmail,
  isValidPassword,
  isValidObjectId,
  isPlainObject,
  normaliseEmail,
  getEmailDomain,
  escapeRegex,
} = require('./validators');
const { parsePagination, buildPage } = require('./pagination');
const sessionService = require('./session.service');
const profileService = require('./profile.service');
const activityService = require('./activity.service');

/**
 * Manages an organisation's admins and users, for the organisation account
 * and for organisation admins. Every function takes the member role it works
 * on (organisation-admin or organisation-user), so an id from the other list
 * is treated as not found.
 */

const ROLE_LABEL = Object.freeze({
  [ROLES.ORGANISATION_ADMIN]: 'Admin',
  [ROLES.ORGANISATION_USER]: 'User',
});

const findMember = async (organisationId, role, memberId) => {
  if (!isValidObjectId(memberId)) {
    throw new ApiError(400, `Invalid ${ROLE_LABEL[role].toLowerCase()} id`);
  }
  const member = await User.findOne({ _id: memberId, organisationId, role });
  if (!member) {
    throw new ApiError(404, `${ROLE_LABEL[role]} not found`);
  }
  return member;
};

/**
 * `options.assignedBy` fixes the managing admin of a new organisation-user
 * (used when an admin creates the user); otherwise payload.assignedBy is used.
 */
const createMember = async (organisationId, role, payload = {}, options = {}) => {
  const { email, password, profile } = payload;
  const assignedBy = options.assignedBy || payload.assignedBy;

  if (!isValidEmail(email)) {
    throw new ApiError(400, 'A valid email is required');
  }
  if (!isValidPassword(password)) {
    throw new ApiError(400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  if (!isPlainObject(profile)) {
    throw new ApiError(400, 'profile object is required');
  }

  const organisation = await User.findById(organisationId).select('email').lean();
  const companyDomain = getEmailDomain(organisation.email);
  if (getEmailDomain(email) !== companyDomain) {
    throw new ApiError(400, `Email must be a company address ending in @${companyDomain}`);
  }

  const normalisedEmail = normaliseEmail(email);
  if (await User.exists({ email: normalisedEmail })) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const profileData = profileService.pickProfileFields(role, profile);

  if (role === ROLES.ORGANISATION_USER && assignedBy !== undefined && assignedBy !== null) {
    if (!isNonEmptyString(assignedBy)) {
      throw new ApiError(400, 'assignedBy must be an organisation admin id');
    }
    await findMember(organisationId, ROLES.ORGANISATION_ADMIN, assignedBy);
    profileData.assignedBy = assignedBy;
  }

  return User.create({
    email: normalisedEmail,
    passwordHash: await sessionService.hashPassword(password),
    role,
    organisationId,
    isVerified: true,
    [PROFILE_KEY_BY_ROLE[role]]: profileData,
  });
};

/**
 * Filters: search (email / name), isActive (true|false),
 * isVerified (false = self-registered and waiting for approval), page, limit
 */
const listMembers = async (organisationId, role, query = {}) => {
  const paging = parsePagination(query);
  const profileKey = PROFILE_KEY_BY_ROLE[role];
  const filter = { organisationId, role };

  if (query.isActive === 'true' || query.isActive === 'false') {
    filter.isActive = query.isActive === 'true';
  }
  if (query.isVerified === 'true' || query.isVerified === 'false') {
    filter.isVerified = query.isVerified === 'true';
  }
  if (isNonEmptyString(query.search)) {
    const pattern = new RegExp(escapeRegex(query.search.trim()), 'i');
    filter.$or = [
      { email: pattern },
      { [`${profileKey}.firstName`]: pattern },
      { [`${profileKey}.lastName`]: pattern },
    ];
  }

  const [members, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(paging.skip).limit(paging.limit).lean(),
    User.countDocuments(filter),
  ]);

  const lastActive = await activityService.getLastActiveByUser(members.map((m) => m._id));
  const items = members.map(({ __v, ...member }) => ({
    ...member,
    lastActiveAt: lastActive.get(String(member._id)) || null,
  }));

  return buildPage(items, total, paging);
};

const getMember = async (organisationId, role, memberId) => {
  const member = await findMember(organisationId, role, memberId);
  const now = new Date();

  const [propertiesCreated, totalSessions, activeSessions, lastActive] = await Promise.all([
    Property.countDocuments({ owner: organisationId, createdBy: member._id, isDeleted: false }),
    UserSession.countDocuments({ user: member._id }),
    UserSession.countDocuments({
      user: member._id,
      endedAt: null,
      refreshTokenExpiresAt: { $gt: now },
    }),
    activityService.getLastActiveByUser([member._id]),
  ]);

  return {
    member,
    stats: {
      propertiesCreated,
      totalSessions,
      activeSessions,
      lastActiveAt: lastActive.get(String(member._id)) || null,
    },
  };
};

/**
 * Permanently removes the account and ends its sessions. Listings it created
 * stay with the organisation; its activity logs are kept for audit.
 * Returns the removed account.
 */
const deleteMember = async (organisationId, role, memberId) => {
  const member = await findMember(organisationId, role, memberId);

  await sessionService.endAllSessions(member._id, SESSION_END_REASONS.ACCOUNT_DELETED);
  await Promise.all([
    Property.updateMany({ assignedTo: member._id }, { $set: { assignedTo: null } }),
    Development.updateMany({ assignedTo: member._id }, { $set: { assignedTo: null } }),
    role === ROLES.ORGANISATION_ADMIN
      ? User.updateMany(
          { organisationId, 'organisationUserProfile.assignedBy': member._id },
          { $unset: { 'organisationUserProfile.assignedBy': 1 } }
        )
      : null,
  ]);
  await User.deleteOne({ _id: member._id });
  return member;
};

/**
 * Lets a self-registered organisation user sign in. When an admin approves,
 * they become the user's managing admin unless one is already set.
 */
const approveMember = async (organisationId, role, memberId, { approvedBy } = {}) => {
  const member = await findMember(organisationId, role, memberId);
  if (member.isVerified) {
    throw new ApiError(409, `${ROLE_LABEL[role]} is already approved`);
  }

  member.isVerified = true;
  const profileKey = PROFILE_KEY_BY_ROLE[role];
  if (role === ROLES.ORGANISATION_USER && approvedBy && !member[profileKey].assignedBy) {
    member[profileKey].assignedBy = approvedBy;
  }
  await member.save();

  return member;
};

/**
 * Starts a session as the member. The session and every call made with it
 * record `impersonatedBy` (the organisation, or the admin who clicked).
 */
const impersonate = async (organisationId, role, memberId, client, impersonatedBy = organisationId) => {
  const member = await findMember(organisationId, role, memberId);
  if (!member.isActive) {
    throw new ApiError(403, `${ROLE_LABEL[role]} account is deactivated`);
  }

  const tokens = await sessionService.startSession(member, { ...client, impersonatedBy });
  return { user: member, impersonatedBy, ...tokens };
};

const listSessions = async (organisationId, role, memberId, query) => {
  const member = await findMember(organisationId, role, memberId);
  return activityService.listSessions(member._id, query);
};

const listSessionActivities = async (organisationId, role, memberId, sessionId, query) => {
  const member = await findMember(organisationId, role, memberId);
  return activityService.listSessionActivities(member._id, sessionId, query);
};

module.exports = {
  findMember,
  createMember,
  listMembers,
  ROLE_LABEL,
  getMember,
  deleteMember,
  approveMember,
  impersonate,
  listSessions,
  listSessionActivities,
};
