const User = require('../../../models/User');
const UserSession = require('../../../models/UserSession');
const ActivityLog = require('../../../models/ActivityLog');
const { Property } = require('../../../models/property');
const { Development } = require('../../../models/development');
const { ROLES, ROLE_VALUES } = require('../../../common/roles');
const {
  PROPERTY_STATUS,
  PROPERTY_STATUS_VALUES,
  OWNER_TYPES,
  APPROVAL_REQUEST_TYPES,
} = require('../../../common/propertyOptions');
const { DEVELOPMENT_STATUS_VALUES } = require('../../../common/developmentOptions');
const sessionService = require('../../../utils/session.service');
const profileService = require('../../../utils/profile.service');
const adminPropertyApprovalService = require('./adminPropertyApproval.service');
const { ACCOUNT_ROLES, fillDays, dayKey } = require('./adminAnalytics.service');
const Blog = require('../../../models/Blog');
const ContactQuery = require('../../../models/ContactQuery');
const {
  BLOG_STATUS_VALUES,
  CONTACT_QUERY_STATUS,
  CONTACT_QUERY_STATUS_VALUES,
} = require('../../../common/contentOptions');

const ADMIN_ROLES = Object.freeze([ROLES.ADMIN]);

const WRONG_ROLE_MESSAGE = 'This login is for platform admins only';

const DAY_MS = 24 * 60 * 60 * 1000;
const TREND_DAYS = 14;

/** Admins are created by the seeder (npm run seed:admin); there is no register */
const login = async (payload, client) => {
  const user = await sessionService.verifyCredentials(payload, ADMIN_ROLES, WRONG_ROLE_MESSAGE);
  const tokens = await sessionService.startSession(user, client);
  return { user, ...tokens };
};

const refreshTokens = (refreshToken) => sessionService.refreshSession(refreshToken, ADMIN_ROLES);

const logout = (sessionId) => sessionService.endSession(sessionId);

const countBy = (rows, keys) =>
  Object.fromEntries(keys.map((key) => [key, rows.find((row) => row._id === key)?.count || 0]));

const getAccountStats = async (since) => {
  const rows = await User.aggregate([
    {
      $group: {
        _id: '$role',
        total: { $sum: 1 },
        active: { $sum: { $cond: ['$isActive', 1, 0] } },
        newSince: { $sum: { $cond: [{ $gte: ['$createdAt', since] }, 1, 0] } },
        unverified: { $sum: { $cond: ['$isVerified', 0, 1] } },
      },
    },
  ]);
  const forRole = (role) => {
    const row = rows.find((r) => r._id === role) || {};
    return { total: row.total || 0, active: row.active || 0, newLast30Days: row.newSince || 0 };
  };
  const companyUsers = rows.find((r) => r._id === ROLES.ORGANISATION_USER);

  return {
    users: forRole(ROLES.USER),
    companies: forRole(ROLES.ORGANISATION),
    companyAdmins: forRole(ROLES.ORGANISATION_ADMIN),
    companyUsers: { ...forRole(ROLES.ORGANISATION_USER), waitingForCompanyApproval: companyUsers?.unverified || 0 },
  };
};

const getPropertyStats = async () => {
  const [result] = await Property.aggregate([
    { $match: { isDeleted: false } },
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              premium: { $sum: { $cond: ['$isPremium', 1, 0] } },
              views: { $sum: '$stats.views' },
              enquiries: { $sum: '$stats.enquiries' },
            },
          },
        ],
        byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
        byOwnerType: [{ $group: { _id: '$ownerType', count: { $sum: 1 } } }],
        waitingForAdmin: [
          { $match: { ownerType: 'user', status: PROPERTY_STATUS.PENDING_APPROVAL } },
          { $group: { _id: '$approval.requestType', count: { $sum: 1 } } },
        ],
      },
    },
  ]);
  const totals = result.totals[0] || {};

  return {
    total: totals.total || 0,
    premium: totals.premium || 0,
    views: totals.views || 0,
    enquiries: totals.enquiries || 0,
    byStatus: countBy(result.byStatus, PROPERTY_STATUS_VALUES),
    byOwnerType: countBy(result.byOwnerType, OWNER_TYPES),
    waitingForAdminApproval: countBy(result.waitingForAdmin, Object.values(APPROVAL_REQUEST_TYPES)),
  };
};

const getDevelopmentStats = async () => {
  const rows = await Development.aggregate([
    { $match: { isDeleted: false } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  return {
    total: rows.reduce((sum, row) => sum + row.count, 0),
    byStatus: countBy(rows, DEVELOPMENT_STATUS_VALUES),
  };
};

/** Platform-wide numbers plus short lists for the admin home page */
const getDashboard = async () => {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * DAY_MS);
  const monthAgo = new Date(now.getTime() - 30 * DAY_MS);

  const trendSince = new Date(now.getTime() - (TREND_DAYS - 1) * DAY_MS - (now.getTime() % DAY_MS));
  const inTrend = { createdAt: { $gte: trendSince } };

  const [
    accounts,
    properties,
    developments,
    activeSessionRows,
    loginsLast7Days,
    apiCallsLast7Days,
    recentLogins,
    recentSignups,
    approvalQueue,
    signupTrend,
    listingTrend,
    developmentTrend,
    loginTrend,
    queryRows,
    blogRows,
    recentQueries,
  ] = await Promise.all([
    getAccountStats(monthAgo),
    getPropertyStats(),
    getDevelopmentStats(),
    UserSession.aggregate([
      { $match: { endedAt: null, refreshTokenExpiresAt: { $gt: now } } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]),
    UserSession.countDocuments({ createdAt: { $gte: weekAgo }, impersonatedBy: null }),
    ActivityLog.countDocuments({ createdAt: { $gte: weekAgo } }),
    UserSession.find({ impersonatedBy: null })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('user role ip device createdAt')
      .populate('user', profileService.ACCOUNT_SUMMARY_FIELDS)
      .lean(),
    User.find({ role: { $in: [ROLES.USER, ROLES.ORGANISATION] } })
      .sort({ createdAt: -1 })
      .limit(5)
      .select(`${profileService.ACCOUNT_SUMMARY_FIELDS} isActive createdAt`)
      .lean(),
    adminPropertyApprovalService.listApprovals({ limit: 5 }),
    User.aggregate([
      { $match: { ...inTrend, role: { $in: ACCOUNT_ROLES } } },
      { $group: { _id: dayKey('createdAt'), count: { $sum: 1 } } },
    ]),
    Property.aggregate([
      { $match: { ...inTrend, isDeleted: false } },
      { $group: { _id: dayKey('createdAt'), count: { $sum: 1 } } },
    ]),
    Development.aggregate([
      { $match: { ...inTrend, isDeleted: false } },
      { $group: { _id: dayKey('createdAt'), count: { $sum: 1 } } },
    ]),
    UserSession.aggregate([
      { $match: { ...inTrend, impersonatedBy: null } },
      { $group: { _id: dayKey('createdAt'), count: { $sum: 1 } } },
    ]),
    ContactQuery.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Blog.aggregate([{ $group: { _id: '$status', count: { $sum: 1 }, views: { $sum: '$views' } } }]),
    ContactQuery.find({ status: CONTACT_QUERY_STATUS.NEW })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email subject createdAt')
      .lean(),
  ]);

  const series = (rows, name) => rows.map((r) => ({ date: r._id, series: name, count: r.count }));

  return {
    accounts,
    properties,
    developments,
    sessions: {
      active: activeSessionRows.reduce((sum, row) => sum + row.count, 0),
      activeByRole: countBy(activeSessionRows, ROLE_VALUES),
      loginsLast7Days,
      apiCallsLast7Days,
    },
    approvalQueue: { total: approvalQueue.pagination.total, oldest: approvalQueue.items },
    trend: fillDays(
      TREND_DAYS,
      [
        ...series(signupTrend, 'signups'),
        ...series(listingTrend, 'properties'),
        ...series(developmentTrend, 'developments'),
        ...series(loginTrend, 'logins'),
      ],
      ['signups', 'properties', 'developments', 'logins']
    ),
    content: {
      contactQueries: {
        total: queryRows.reduce((sum, row) => sum + row.count, 0),
        byStatus: countBy(queryRows, CONTACT_QUERY_STATUS_VALUES),
        latestNew: recentQueries,
      },
      blogs: {
        total: blogRows.reduce((sum, row) => sum + row.count, 0),
        byStatus: countBy(blogRows, BLOG_STATUS_VALUES),
        views: blogRows.reduce((sum, row) => sum + row.views, 0),
      },
    },
    recentLogins,
    recentSignups,
  };
};

module.exports = {
  login,
  refreshTokens,
  logout,
  getProfile: profileService.getProfile,
  updateProfile: profileService.updateProfile,
  uploadProfilePhoto: profileService.uploadProfilePhoto,
  removeProfilePhoto: profileService.removeProfilePhoto,
  changePassword: sessionService.changePassword,
  getDashboard,
};
