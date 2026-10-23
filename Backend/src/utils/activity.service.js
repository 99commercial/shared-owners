const mongoose = require('mongoose');
const UserSession = require('../models/UserSession');
const ActivityLog = require('../models/ActivityLog');
const ApiError = require('./ApiError');
const { isValidObjectId } = require('./validators');
const { parsePagination, buildPage } = require('./pagination');
const { normaliseIp } = require('./requestInfo');

const SESSION_FIELDS =
  'role impersonatedBy ip userAgent device lastActivityAt endedAt endReason refreshTokenExpiresAt createdAt';

/** Login sessions of a user, newest first, each with its number of API calls */
const listSessions = async (userId, query) => {
  const paging = parsePagination(query);
  const filter = { user: userId };

  const [sessions, total] = await Promise.all([
    UserSession.find(filter)
      .sort({ createdAt: -1 })
      .skip(paging.skip)
      .limit(paging.limit)
      .select(SESSION_FIELDS)
      .lean(),
    UserSession.countDocuments(filter),
  ]);

  const counts = await ActivityLog.aggregate([
    { $match: { session: { $in: sessions.map((s) => s._id) } } },
    { $group: { _id: '$session', count: { $sum: 1 } } },
  ]);
  const countBySession = new Map(counts.map((c) => [String(c._id), c.count]));

  const now = new Date();
  const items = sessions.map((s) => ({
    ...s,
    startedAt: s.createdAt,
    isActive: !s.endedAt && s.refreshTokenExpiresAt > now,
    activityCount: countBySession.get(String(s._id)) || 0,
  }));

  return buildPage(items, total, paging);
};

/** API calls made during one session of the user, in the order they happened */
const listSessionActivities = async (userId, sessionId, query) => {
  if (!isValidObjectId(sessionId)) {
    throw new ApiError(400, 'Invalid session id');
  }

  const session = await UserSession.findOne({ _id: sessionId, user: userId })
    .select(SESSION_FIELDS)
    .lean();
  if (!session) {
    throw new ApiError(404, 'Session not found');
  }

  const paging = parsePagination(query);
  const filter = { session: session._id };

  const [items, total] = await Promise.all([
    ActivityLog.find(filter)
      .sort({ createdAt: 1 })
      .skip(paging.skip)
      .limit(paging.limit)
      .select('method path route query statusCode durationMs ip impersonatedBy createdAt')
      .lean(),
    ActivityLog.countDocuments(filter),
  ]);

  return { session, ...buildPage(items, total, paging) };
};

/** Map of userId -> last time any of their sessions made an API call */
const getLastActiveByUser = async (userIds) => {
  if (!userIds.length) return new Map();

  const rows = await UserSession.aggregate([
    { $match: { user: { $in: userIds.map((id) => new mongoose.Types.ObjectId(String(id))) } } },
    { $group: { _id: '$user', lastActiveAt: { $max: '$lastActivityAt' } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r.lastActiveAt]));
};

/** Same address with and without the IPv4-mapped prefix, so older sessions still match */
const ipVariants = (ip) => {
  const plain = normaliseIp(ip.trim());
  return plain.includes(':') ? [plain] : [plain, `::ffff:${plain}`];
};

/**
 * Accounts that have ever logged in (or been impersonated) from this IP:
 * the accounts themselves, and the organisations those accounts belong to.
 */
const findAccountsByIp = async (ip) => {
  const filter = { ip: { $in: ipVariants(ip) } };
  const [userIds, organisationIds] = await Promise.all([
    UserSession.distinct('user', filter),
    UserSession.distinct('organisationId', { ...filter, organisationId: { $ne: null } }),
  ]);
  return { userIds, organisationIds };
};

/** Every IP the account logged in from (own logins only), most recent first */
const getLoginIps = async (userId, limit = 20) => {
  const rows = await UserSession.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(String(userId)), impersonatedBy: null } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$ip',
        logins: { $sum: 1 },
        firstSeenAt: { $min: '$createdAt' },
        lastSeenAt: { $max: '$createdAt' },
        lastDevice: { $first: '$device' },
        lastUserAgent: { $first: '$userAgent' },
      },
    },
    { $sort: { lastSeenAt: -1 } },
    { $limit: limit },
  ]);
  return rows.map(({ _id, ...row }) => ({ ip: _id, ...row }));
};

module.exports = {
  listSessions,
  listSessionActivities,
  getLastActiveByUser,
  findAccountsByIp,
  getLoginIps,
};
