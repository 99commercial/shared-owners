const User = require('../../../models/User');
const UserSession = require('../../../models/UserSession');
const { Property } = require('../../../models/property');
const ApiError = require('../../../utils/ApiError');
const { ROLES } = require('../../../common/roles');
const { SESSION_END_REASONS } = require('../../../common/sessionOptions');
const { isValidObjectId } = require('../../../utils/validators');
const { parsePagination, buildPage } = require('../../../utils/pagination');
const sessionService = require('../../../utils/session.service');
const activityService = require('../../../utils/activity.service');
const propertyService = require('../../../utils/property.service');
const { buildAccountFilter, countByField, updateAccount } = require('./adminAccount.service');

/** Individual users (role `user`). `admin` is req.user. */
const USER_ROLE = ROLES.USER;

const SEARCH_FIELDS = ['email', 'userProfile.firstName', 'userProfile.lastName', 'lastLogin.ip'];

const findUser = async (userId) => {
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, 'Invalid user id');
  }
  const user = await User.findOne({ _id: userId, role: USER_ROLE });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return user;
};

/** Filters: search (email / name / last IP), isActive, ip, page, limit */
const listUsers = async (query = {}) => {
  const paging = parsePagination(query);
  const filter = await buildAccountFilter(USER_ROLE, query, SEARCH_FIELDS);

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(paging.skip).limit(paging.limit).lean(),
    User.countDocuments(filter),
  ]);

  const ids = users.map((u) => u._id);
  const [propertyCounts, lastActive] = await Promise.all([
    countByField(Property, 'owner', ids, { ownerType: 'user', isDeleted: false }),
    activityService.getLastActiveByUser(ids),
  ]);

  const items = users.map(({ __v, ...user }) => ({
    ...user,
    propertyCount: propertyCounts.get(String(user._id)) || 0,
    lastActiveAt: lastActive.get(String(user._id)) || null,
  }));
  return buildPage(items, total, paging);
};

/** Profile, last login, every IP used, sessions and listing numbers */
const getUser = async (userId) => {
  const user = await findUser(userId);
  const now = new Date();

  const [properties, loginIps, totalSessions, activeSessions, lastActive] = await Promise.all([
    propertyService.getPropertyAnalytics({ ownerType: 'user', ownerId: user._id }),
    activityService.getLoginIps(user._id),
    UserSession.countDocuments({ user: user._id }),
    UserSession.countDocuments({ user: user._id, endedAt: null, refreshTokenExpiresAt: { $gt: now } }),
    activityService.getLastActiveByUser([user._id]),
  ]);

  return {
    user,
    loginIps,
    sessions: {
      total: totalSessions,
      active: activeSessions,
      lastActiveAt: lastActive.get(String(user._id)) || null,
    },
    properties,
  };
};

/**
 * Permanently removes the account and ends its sessions. Its listings are
 * soft deleted (hidden, kept for enquiries); activity logs are kept for audit.
 */
const deleteUser = async (admin, userId) => {
  const user = await findUser(userId);

  await sessionService.endAllSessions(user._id, SESSION_END_REASONS.ACCOUNT_DELETED);
  const { modifiedCount } = await Property.updateMany(
    { owner: user._id, ownerType: 'user', isDeleted: false },
    { $set: { isDeleted: true, deletedAt: new Date(), deletedBy: admin.id } }
  );
  await User.deleteOne({ _id: user._id });

  return { propertiesRemoved: modifiedCount };
};

/** Body: { isActive?, profile? } */
const updateUser = async (userId, body) => updateAccount(await findUser(userId), body);

/** "Go inside" the user's account: a session as them, recorded as impersonated by the admin */
const impersonateUser = async (admin, userId, client) =>
  sessionService.impersonateAccount(await findUser(userId), client, admin.id);

const listSessions = async (userId, query) => {
  const user = await findUser(userId);
  return activityService.listSessions(user._id, query);
};

const listSessionActivities = async (userId, sessionId, query) => {
  const user = await findUser(userId);
  return activityService.listSessionActivities(user._id, sessionId, query);
};

module.exports = {
  listUsers,
  getUser,
  deleteUser,
  updateUser,
  impersonateUser,
  listSessions,
  listSessionActivities,
};
