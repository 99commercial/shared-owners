const mongoose = require('mongoose');
const User = require('../models/User');
const UserSession = require('../models/UserSession');
const ActivityLog = require('../models/ActivityLog');
const { Property } = require('../models/property');
const { ROLES } = require('../common/roles');
const propertyService = require('./property.service');
const developmentService = require('./development.service');

const MEMBER_NAME_FIELDS =
  'email role organisationAdminProfile.firstName organisationAdminProfile.lastName organisationUserProfile.firstName organisationUserProfile.lastName organisationProfile.name';

const countMembers = async (organisationId) => {
  const rows = await User.aggregate([
    { $match: { organisationId: new mongoose.Types.ObjectId(String(organisationId)) } },
    {
      $group: {
        _id: '$role',
        total: { $sum: 1 },
        active: { $sum: { $cond: ['$isActive', 1, 0] } },
      },
    },
  ]);
  const forRole = (role) => {
    const row = rows.find((r) => r._id === role);
    return { total: row?.total || 0, active: row?.active || 0 };
  };
  return {
    admins: forRole(ROLES.ORGANISATION_ADMIN),
    users: forRole(ROLES.ORGANISATION_USER),
  };
};

/** Which org accounts uploaded the most listings */
const getTopUploaders = async (organisationId) => {
  const rows = await Property.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(String(organisationId)),
        ownerType: 'organisation',
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: '$createdBy',
        properties: { $sum: 1 },
        live: { $sum: { $cond: [{ $eq: ['$status', 'live'] }, 1, 0] } },
      },
    },
    { $sort: { properties: -1 } },
    { $limit: 5 },
  ]);

  const uploaders = await User.find({ _id: { $in: rows.map((r) => r._id) } })
    .select(MEMBER_NAME_FIELDS)
    .lean();
  const byId = new Map(uploaders.map((u) => [String(u._id), u]));

  return rows.map((r) => ({
    user: byId.get(String(r._id)) || { _id: r._id, deleted: true },
    properties: r.properties,
    live: r.live,
  }));
};

/** Organisation-wide dashboard, shown to the organisation account and its admins */
const getDashboard = async (organisationId) => {
  const ctx = { ownerType: 'organisation', ownerId: organisationId };
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [properties, developments, members, activeSessions, apiCallsLast7Days, topUploaders, recentActivity] =
    await Promise.all([
      propertyService.getPropertyAnalytics(ctx),
      developmentService.getDevelopmentCounts(ctx),
      countMembers(organisationId),
      UserSession.countDocuments({
        organisationId,
        endedAt: null,
        refreshTokenExpiresAt: { $gt: now },
      }),
      ActivityLog.countDocuments({ organisationId, createdAt: { $gte: weekAgo } }),
      getTopUploaders(organisationId),
      ActivityLog.find({ organisationId })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('user method path statusCode impersonatedBy createdAt')
        .populate('user', MEMBER_NAME_FIELDS)
        .lean(),
    ]);

  return {
    properties,
    developments,
    members: { ...members, activeSessions, apiCallsLast7Days },
    topUploaders,
    recentActivity,
  };
};

module.exports = { countMembers, getDashboard };
