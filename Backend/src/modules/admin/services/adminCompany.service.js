const mongoose = require('mongoose');
const User = require('../../../models/User');
const UserSession = require('../../../models/UserSession');
const { Property } = require('../../../models/property');
const { Development } = require('../../../models/development');
const ApiError = require('../../../utils/ApiError');
const { ROLES } = require('../../../common/roles');
const { SESSION_END_REASONS } = require('../../../common/sessionOptions');
const { isValidObjectId } = require('../../../utils/validators');
const { parsePagination, buildPage } = require('../../../utils/pagination');
const sessionService = require('../../../utils/session.service');
const activityService = require('../../../utils/activity.service');
const propertyService = require('../../../utils/property.service');
const developmentService = require('../../../utils/development.service');
const { countMembers } = require('../../../utils/organisationDashboard.service');
const { buildAccountFilter, countByField, updateAccount } = require('./adminAccount.service');

/** Companies are organisation accounts (role `organisation`). `admin` is req.user. */
const COMPANY_ROLE = ROLES.ORGANISATION;

const SEARCH_FIELDS = [
  'email',
  'organisationProfile.name',
  'organisationProfile.slug',
  'organisationProfile.contactEmail',
  'lastLogin.ip',
];

const findCompany = async (companyId) => {
  if (!isValidObjectId(companyId)) {
    throw new ApiError(400, 'Invalid company id');
  }
  const company = await User.findOne({ _id: companyId, role: COMPANY_ROLE });
  if (!company) {
    throw new ApiError(404, 'Company not found');
  }
  return company;
};

/** Member counts per company: Map(companyId -> { admins, users }) */
const countMembersByCompany = async (ids) => {
  if (!ids.length) return new Map();
  const rows = await User.aggregate([
    { $match: { organisationId: { $in: ids.map((id) => new mongoose.Types.ObjectId(String(id))) } } },
    { $group: { _id: { organisationId: '$organisationId', role: '$role' }, count: { $sum: 1 } } },
  ]);
  const byCompany = new Map();
  rows.forEach(({ _id, count }) => {
    const key = String(_id.organisationId);
    const counts = byCompany.get(key) || { admins: 0, users: 0 };
    if (_id.role === ROLES.ORGANISATION_ADMIN) counts.admins = count;
    if (_id.role === ROLES.ORGANISATION_USER) counts.users = count;
    byCompany.set(key, counts);
  });
  return byCompany;
};

/** Filters: search (email / name / slug / last IP), isActive, ip (company or any member), page, limit */
const listCompanies = async (query = {}) => {
  const paging = parsePagination(query);
  const filter = await buildAccountFilter(COMPANY_ROLE, query, SEARCH_FIELDS);

  const [companies, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(paging.skip).limit(paging.limit).lean(),
    User.countDocuments(filter),
  ]);

  const ids = companies.map((c) => c._id);
  const [members, propertyCounts, developmentCounts, lastActive] = await Promise.all([
    countMembersByCompany(ids),
    countByField(Property, 'owner', ids, { ownerType: 'organisation', isDeleted: false }),
    countByField(Development, 'owner', ids, { isDeleted: false }),
    activityService.getLastActiveByUser(ids),
  ]);

  const items = companies.map(({ __v, ...company }) => {
    const key = String(company._id);
    return {
      ...company,
      members: members.get(key) || { admins: 0, users: 0 },
      propertyCount: propertyCounts.get(key) || 0,
      developmentCount: developmentCounts.get(key) || 0,
      lastActiveAt: lastActive.get(key) || null,
    };
  });
  return buildPage(items, total, paging);
};

/** Company overview for its panel: profile, last login, IPs, team, listings */
const getCompany = async (companyId) => {
  const company = await findCompany(companyId);
  const now = new Date();

  const [members, properties, developments, loginIps, totalSessions, activeSessions, lastActive] =
    await Promise.all([
      countMembers(company._id),
      propertyService.getPropertyAnalytics({ ownerType: 'organisation', ownerId: company._id }),
      developmentService.getDevelopmentCounts({ ownerId: company._id }),
      activityService.getLoginIps(company._id),
      UserSession.countDocuments({ user: company._id }),
      UserSession.countDocuments({ user: company._id, endedAt: null, refreshTokenExpiresAt: { $gt: now } }),
      activityService.getLastActiveByUser([company._id]),
    ]);

  return {
    company,
    members,
    loginIps,
    sessions: {
      total: totalSessions,
      active: activeSessions,
      lastActiveAt: lastActive.get(String(company._id)) || null,
    },
    properties,
    developments,
  };
};

/**
 * Permanently removes the company with all its admins and users, ending every
 * session. Its listings and developments are soft deleted; activity logs are kept.
 */
const deleteCompany = async (admin, companyId) => {
  const company = await findCompany(companyId);
  const memberIds = await User.find({ organisationId: company._id }).distinct('_id');
  const accountIds = [company._id, ...memberIds];
  const now = new Date();
  const softDelete = { $set: { isDeleted: true, deletedAt: now, deletedBy: admin.id } };

  await UserSession.updateMany(
    { user: { $in: accountIds }, endedAt: null },
    { $set: { endedAt: now, endReason: SESSION_END_REASONS.ACCOUNT_DELETED } }
  );
  const [properties, developments] = await Promise.all([
    Property.updateMany({ owner: company._id, ownerType: 'organisation', isDeleted: false }, softDelete),
    Development.updateMany({ owner: company._id, isDeleted: false }, softDelete),
  ]);
  await User.deleteMany({ _id: { $in: accountIds } });

  return {
    membersRemoved: memberIds.length,
    propertiesRemoved: properties.modifiedCount,
    developmentsRemoved: developments.modifiedCount,
  };
};

/**
 * Body: { isActive?, profile? }. Deactivating also signs out its admins and users;
 * they cannot sign in again while the company is deactivated.
 */
const updateCompany = async (companyId, body) => {
  const company = await findCompany(companyId);
  const memberIds = body?.isActive === false
    ? await User.find({ organisationId: company._id }).distinct('_id')
    : [];
  return updateAccount(company, body, memberIds);
};

/** "Go inside" the company account, recorded as impersonated by the admin */
const impersonateCompany = async (admin, companyId, client) =>
  sessionService.impersonateAccount(await findCompany(companyId), client, admin.id);

const listSessions = async (companyId, query) => {
  const company = await findCompany(companyId);
  return activityService.listSessions(company._id, query);
};

const listSessionActivities = async (companyId, sessionId, query) => {
  const company = await findCompany(companyId);
  return activityService.listSessionActivities(company._id, sessionId, query);
};

module.exports = {
  findCompany,
  listCompanies,
  getCompany,
  deleteCompany,
  updateCompany,
  impersonateCompany,
  listSessions,
  listSessionActivities,
};
