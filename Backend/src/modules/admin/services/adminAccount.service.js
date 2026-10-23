const mongoose = require('mongoose');
const UserSession = require('../../../models/UserSession');
const ApiError = require('../../../utils/ApiError');
const { isNonEmptyString, isPlainObject, escapeRegex } = require('../../../utils/validators');
const { SESSION_END_REASONS } = require('../../../common/sessionOptions');
const activityService = require('../../../utils/activity.service');
const profileService = require('../../../utils/profile.service');

/**
 * Filter for the users / companies lists.
 * Query: search (matched against `searchFields`), isActive (true|false),
 * ip (accounts that logged in from that address; for companies also
 * companies whose admins / users did).
 */
const buildAccountFilter = async (role, query, searchFields) => {
  const filter = { role };

  if (query.isActive === 'true' || query.isActive === 'false') {
    filter.isActive = query.isActive === 'true';
  }
  if (isNonEmptyString(query.search)) {
    const pattern = new RegExp(escapeRegex(query.search.trim()), 'i');
    filter.$or = searchFields.map((field) => ({ [field]: pattern }));
  }
  if (query.ip !== undefined) {
    if (!isNonEmptyString(query.ip)) {
      throw new ApiError(400, 'ip must be an IP address');
    }
    const { userIds, organisationIds } = await activityService.findAccountsByIp(query.ip);
    filter._id = { $in: [...userIds, ...organisationIds] };
  }

  return filter;
};

/** Map of id -> count, from a model grouped by `field` */
const countByField = async (Model, field, ids, match = {}) => {
  if (!ids.length) return new Map();
  const rows = await Model.aggregate([
    { $match: { ...match, [field]: { $in: ids.map((id) => new mongoose.Types.ObjectId(String(id))) } } },
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((row) => [String(row._id), row.count]));
};

/**
 * Admin edit of any account. Body: { isActive?, profile? } where profile takes the
 * same fields the account can edit itself. Deactivating signs the account out
 * everywhere, along with `alsoSignOut` (a company's admins and users).
 */
const updateAccount = async (account, body, alsoSignOut = []) => {
  if (!isPlainObject(body)) {
    throw new ApiError(400, 'Request body must be an object');
  }
  const { isActive, profile } = body;
  if (isActive === undefined && profile === undefined) {
    throw new ApiError(400, 'Provide isActive and/or profile');
  }
  if (isActive !== undefined && typeof isActive !== 'boolean') {
    throw new ApiError(400, 'isActive must be true or false');
  }

  const user = profile === undefined ? account : await profileService.updateProfile(account._id, profile);

  if (isActive !== undefined && isActive !== user.isActive) {
    user.isActive = isActive;
    await user.save();
    if (!isActive) {
      await UserSession.updateMany(
        { user: { $in: [user._id, ...alsoSignOut] }, endedAt: null },
        { $set: { endedAt: new Date(), endReason: SESSION_END_REASONS.DEACTIVATED } }
      );
    }
  }
  return user;
};

module.exports = { buildAccountFilter, countByField, updateAccount };
