const User = require('../../../models/User');
const UserSession = require('../../../models/UserSession');
const ActivityLog = require('../../../models/ActivityLog');
const { Property } = require('../../../models/property');
const { Development } = require('../../../models/development');
const ApiError = require('../../../utils/ApiError');
const { ROLES } = require('../../../common/roles');
const {
  PROPERTY_STATUS,
  PROPERTY_STATUS_VALUES,
  OWNER_TYPES,
  APPROVAL_REQUEST_TYPES,
} = require('../../../common/propertyOptions');
const { DEVELOPMENT_STATUS, DEVELOPMENT_STATUS_VALUES } = require('../../../common/developmentOptions');
const { ACCOUNT_SUMMARY_FIELDS } = require('../../../utils/profile.service');

const DAY_MS = 24 * 60 * 60 * 1000;
const TIMEZONE = 'Europe/London';
const RANGE_DAYS = [7, 30, 90, 365];
const DEFAULT_RANGE_DAYS = 30;

/** Every role except platform admins, in the order the dashboards list them */
const ACCOUNT_ROLES = [ROLES.USER, ROLES.ORGANISATION, ROLES.ORGANISATION_ADMIN, ROLES.ORGANISATION_USER];

/** Full market value bands in pence */
const PRICE_BOUNDARIES = [0, 20000000, 30000000, 40000000, 50000000, 75000000, 100000000];
const PRICE_BAND_LABELS = ['Under £200k', '£200k–£300k', '£300k–£400k', '£400k–£500k', '£500k–£750k', '£750k–£1m'];

const parseRange = (query = {}) => {
  const days = query.days === undefined ? DEFAULT_RANGE_DAYS : Number(query.days);
  if (!RANGE_DAYS.includes(days)) {
    throw new ApiError(400, `days must be one of: ${RANGE_DAYS.join(', ')}`);
  }
  return { days, since: new Date(Date.now() - (days - 1) * DAY_MS - (Date.now() % DAY_MS)) };
};

const dayKey = (field) => ({ $dateToString: { format: '%Y-%m-%d', date: `$${field}`, timezone: TIMEZONE } });
const toDateKey = (date) => date.toLocaleDateString('en-CA', { timeZone: TIMEZONE });

/** One entry per day of the range, so charts have no gaps: [{ date, ...series }] */
const fillDays = (days, rows, seriesKeys) => {
  const byDate = new Map();
  rows.forEach((row) => {
    const entry = byDate.get(row.date) || {};
    entry[row.series] = (entry[row.series] || 0) + row.count;
    byDate.set(row.date, entry);
  });
  return Array.from({ length: days }, (_, i) => {
    const date = toDateKey(new Date(Date.now() - (days - 1 - i) * DAY_MS));
    const entry = byDate.get(date) || {};
    const point = { date };
    seriesKeys.forEach((key) => { point[key] = entry[key] || 0; });
    point.total = seriesKeys.reduce((sum, key) => sum + point[key], 0);
    return point;
  });
};

const countMap = (rows, keys) =>
  Object.fromEntries(keys.map((key) => [key, rows.find((row) => row._id === key)?.count || 0]));

const breakdown = (rows) =>
  rows
    .filter((row) => row._id !== null && row._id !== undefined && row._id !== '')
    .map((row) => ({ value: row._id, count: row.count }))
    .sort((a, b) => b.count - a.count);

const topValues = (field, limit = 8) => [
  { $match: { [field]: { $nin: [null, ''] } } },
  { $group: { _id: `$${field}`, count: { $sum: 1 } } },
  { $sort: { count: -1 } },
  { $limit: limit },
];

/** Replaces each row's `_id` (an account id) with the account summary under `as` */
const withAccounts = async (rows, as = 'account') => {
  const accounts = await User.find({ _id: { $in: rows.map((row) => row._id) } })
    .select(`${ACCOUNT_SUMMARY_FIELDS} isActive`)
    .lean();
  const byId = new Map(accounts.map((a) => [String(a._id), a]));
  return rows.map(({ _id, ...row }) => ({ [as]: byId.get(String(_id)) || { _id, deleted: true }, ...row }));
};

const pounds = (pence) => (pence ? Math.round(pence / 100) : 0);

// ── Accounts ─────────────────────────────────────────────────────────────

const getAccountAnalytics = async (query) => {
  const { days, since } = parseRange(query);
  const now = new Date();
  const nonAdmin = { role: { $in: ACCOUNT_ROLES } };
  const ownLogins = { createdAt: { $gte: since }, impersonatedBy: null };

  const [
    roleRows,
    signupRows,
    loginRows,
    deviceRows,
    browserRows,
    osRows,
    activeSessionRows,
    impersonations,
    activeRows,
    companyTypeRows,
    companySizeRows,
    recentSignups,
  ] = await Promise.all([
    User.aggregate([
      { $match: nonAdmin },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } },
          unverified: { $sum: { $cond: ['$isVerified', 0, 1] } },
          newInRange: { $sum: { $cond: [{ $gte: ['$createdAt', since] }, 1, 0] } },
        },
      },
    ]),
    User.aggregate([
      { $match: { ...nonAdmin, createdAt: { $gte: since } } },
      { $group: { _id: { date: dayKey('createdAt'), series: '$role' }, count: { $sum: 1 } } },
    ]),
    UserSession.aggregate([
      { $match: { ...ownLogins, role: { $in: ACCOUNT_ROLES } } },
      { $group: { _id: dayKey('createdAt'), logins: { $sum: 1 }, accounts: { $addToSet: '$user' } } },
    ]),
    UserSession.aggregate([{ $match: ownLogins }, { $group: { _id: '$device.deviceType', count: { $sum: 1 } } }]),
    UserSession.aggregate([{ $match: ownLogins }, ...topValues('device.browser', 6)]),
    UserSession.aggregate([{ $match: ownLogins }, ...topValues('device.os', 6)]),
    UserSession.aggregate([
      { $match: { endedAt: null, refreshTokenExpiresAt: { $gt: now }, role: { $in: ACCOUNT_ROLES } } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]),
    UserSession.countDocuments({ createdAt: { $gte: since }, impersonatedBy: { $ne: null } }),
    ActivityLog.aggregate([
      { $match: { createdAt: { $gte: since }, impersonatedBy: null, role: { $in: ACCOUNT_ROLES } } },
      { $group: { _id: '$user', actions: { $sum: 1 }, lastActionAt: { $max: '$createdAt' } } },
      { $sort: { actions: -1 } },
      { $limit: 10 },
    ]),
    User.aggregate([{ $match: { role: ROLES.ORGANISATION } }, ...topValues('organisationProfile.type', 10)]),
    User.aggregate([
      { $match: { organisationId: { $ne: null } } },
      { $group: { _id: '$organisationId', members: { $sum: 1 } } },
      { $sort: { members: -1 } },
      { $limit: 6 },
    ]),
    User.find(nonAdmin)
      .sort({ createdAt: -1 })
      .limit(8)
      .select(`${ACCOUNT_SUMMARY_FIELDS} isActive isVerified createdAt`)
      .lean(),
  ]);

  const byRole = Object.fromEntries(
    ACCOUNT_ROLES.map((role) => {
      const row = roleRows.find((r) => r._id === role) || {};
      return [role, {
        total: row.count || 0,
        active: row.active || 0,
        inactive: (row.count || 0) - (row.active || 0),
        unverified: row.unverified || 0,
        newInRange: row.newInRange || 0,
      }];
    })
  );
  const all = Object.values(byRole).reduce(
    (sum, r) => Object.fromEntries(Object.keys(r).map((k) => [k, (sum[k] || 0) + r[k]])),
    {}
  );

  const loginsByDate = new Map(loginRows.map((r) => [r._id, r]));
  const loginsByDay = fillDays(days, [], []).map(({ date }) => ({
    date,
    logins: loginsByDate.get(date)?.logins || 0,
    uniqueAccounts: loginsByDate.get(date)?.accounts.length || 0,
  }));

  const [mostActive, largestCompanies] = await Promise.all([
    withAccounts(activeRows),
    withAccounts(companySizeRows, 'company'),
  ]);

  return {
    range: { days, since },
    totals: { all, byRole },
    signupsByDay: fillDays(
      days,
      signupRows.map((r) => ({ date: r._id.date, series: r._id.series, count: r.count })),
      ACCOUNT_ROLES
    ),
    loginsByDay,
    sessions: {
      active: activeSessionRows.reduce((sum, r) => sum + r.count, 0),
      activeByRole: countMap(activeSessionRows, ACCOUNT_ROLES),
      loginsInRange: loginsByDay.reduce((sum, d) => sum + d.logins, 0),
      impersonationsInRange: impersonations,
    },
    devices: breakdown(deviceRows),
    browsers: breakdown(browserRows),
    operatingSystems: breakdown(osRows),
    companiesByType: breakdown(companyTypeRows),
    largestCompanies,
    mostActive,
    recentSignups,
  };
};

// ── Properties ───────────────────────────────────────────────────────────

const LISTING_CARD = {
  name: 1,
  status: 1,
  ownerType: 1,
  owner: 1,
  'address.townCity': 1,
  'address.postcode': 1,
  'searchSnapshot.primaryImageUrl': 1,
  stats: 1,
  createdAt: 1,
};

const getPropertyAnalytics = async (query) => {
  const { days, since } = parseRange(query);

  const [result] = await Property.aggregate([
    { $match: { isDeleted: false } },
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              live: { $sum: { $cond: [{ $eq: ['$status', PROPERTY_STATUS.LIVE] }, 1, 0] } },
              premium: { $sum: { $cond: ['$isPremium', 1, 0] } },
              incomplete: { $sum: { $cond: ['$completion.isComplete', 0, 1] } },
              inDevelopment: { $sum: { $cond: [{ $ifNull: ['$development', false] }, 1, 0] } },
              views: { $sum: '$stats.views' },
              enquiries: { $sum: '$stats.enquiries' },
              averageValue: { $avg: '$searchSnapshot.fullMarketValue' },
              averageShare: { $avg: '$searchSnapshot.minimumSharePercentage' },
              newInRange: { $sum: { $cond: [{ $gte: ['$createdAt', since] }, 1, 0] } },
            },
          },
        ],
        byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
        byOwnerType: [{ $group: { _id: '$ownerType', count: { $sum: 1 } } }],
        bySchemeType: [{ $group: { _id: '$searchSnapshot.schemeType', count: { $sum: 1 } } }],
        byAvailability: [{ $group: { _id: '$searchSnapshot.availability', count: { $sum: 1 } } }],
        byPropertyType: [{ $group: { _id: '$searchSnapshot.propertyType', count: { $sum: 1 } } }],
        byBedrooms: [
          { $match: { 'searchSnapshot.bedrooms': { $ne: null } } },
          { $group: { _id: { $min: ['$searchSnapshot.bedrooms', 5] }, count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ],
        priceBands: [
          { $match: { 'searchSnapshot.fullMarketValue': { $gt: 0 } } },
          {
            $bucket: {
              groupBy: '$searchSnapshot.fullMarketValue',
              boundaries: PRICE_BOUNDARIES,
              default: 'over',
              output: { count: { $sum: 1 } },
            },
          },
        ],
        topTowns: topValues('address.townCity'),
        topAuthorities: topValues('address.localAuthority'),
        created: [
          { $match: { createdAt: { $gte: since } } },
          { $group: { _id: { date: dayKey('createdAt'), series: '$ownerType' }, count: { $sum: 1 } } },
        ],
        published: [
          { $match: { publishedAt: { $gte: since } } },
          { $group: { _id: dayKey('publishedAt'), count: { $sum: 1 } } },
        ],
        waitingForAdmin: [
          { $match: { ownerType: 'user', status: PROPERTY_STATUS.PENDING_APPROVAL } },
          { $group: { _id: '$approval.requestType', count: { $sum: 1 } } },
        ],
        topOwners: [
          {
            $group: {
              _id: '$owner',
              ownerType: { $first: '$ownerType' },
              listings: { $sum: 1 },
              live: { $sum: { $cond: [{ $eq: ['$status', PROPERTY_STATUS.LIVE] }, 1, 0] } },
              views: { $sum: '$stats.views' },
            },
          },
          { $sort: { listings: -1 } },
          { $limit: 8 },
        ],
        mostViewed: [
          { $match: { 'stats.views': { $gt: 0 } } },
          { $sort: { 'stats.views': -1 } },
          { $limit: 6 },
          { $project: LISTING_CARD },
        ],
        mostEnquired: [
          { $match: { 'stats.enquiries': { $gt: 0 } } },
          { $sort: { 'stats.enquiries': -1 } },
          { $limit: 6 },
          { $project: LISTING_CARD },
        ],
        recent: [{ $sort: { createdAt: -1 } }, { $limit: 6 }, { $project: LISTING_CARD }],
      },
    },
  ]);

  const t = result.totals[0] || {};
  const priceRows = result.priceBands.map((row) => ({
    value: row._id === 'over' ? 'Over £1m' : PRICE_BAND_LABELS[PRICE_BOUNDARIES.indexOf(row._id)],
    count: row.count,
  }));
  const topOwners = await withAccounts(result.topOwners, 'owner');

  return {
    range: { days, since },
    totals: {
      total: t.total || 0,
      live: t.live || 0,
      premium: t.premium || 0,
      incomplete: t.incomplete || 0,
      inDevelopment: t.inDevelopment || 0,
      newInRange: t.newInRange || 0,
      views: t.views || 0,
      enquiries: t.enquiries || 0,
      enquiryRate: t.views ? Number(((t.enquiries / t.views) * 100).toFixed(2)) : 0,
      averageFullMarketValue: pounds(t.averageValue),
      averageMinimumShare: t.averageShare ? Number(t.averageShare.toFixed(1)) : 0,
    },
    byStatus: countMap(result.byStatus, PROPERTY_STATUS_VALUES),
    byOwnerType: countMap(result.byOwnerType, OWNER_TYPES),
    bySchemeType: breakdown(result.bySchemeType),
    byAvailability: breakdown(result.byAvailability),
    byPropertyType: breakdown(result.byPropertyType),
    byBedrooms: result.byBedrooms.map((row) => ({
      value: row._id === 0 ? 'Studio' : row._id >= 5 ? '5+ bed' : `${row._id} bed`,
      count: row.count,
    })),
    priceBands: priceRows,
    topTowns: breakdown(result.topTowns),
    topAuthorities: breakdown(result.topAuthorities),
    createdByDay: fillDays(
      days,
      result.created.map((r) => ({ date: r._id.date, series: r._id.series, count: r.count })),
      OWNER_TYPES
    ),
    publishedByDay: fillDays(
      days,
      result.published.map((r) => ({ date: r._id, series: 'published', count: r.count })),
      ['published']
    ),
    waitingForAdminApproval: countMap(result.waitingForAdmin, Object.values(APPROVAL_REQUEST_TYPES)),
    topOwners,
    mostViewed: result.mostViewed,
    mostEnquired: result.mostEnquired,
    recent: result.recent,
  };
};

// ── Developments ─────────────────────────────────────────────────────────

const getDevelopmentAnalytics = async (query) => {
  const { days, since } = parseRange(query);

  const [[result], linkedRows, topLinked] = await Promise.all([
    Development.aggregate([
      { $match: { isDeleted: false } },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                live: { $sum: { $cond: [{ $eq: ['$status', DEVELOPMENT_STATUS.LIVE] }, 1, 0] } },
                premium: { $sum: { $cond: ['$isPremium', 1, 0] } },
                homesForLondoners: { $sum: { $cond: ['$syndication.homesForLondoners', 1, 0] } },
                withImages: { $sum: { $cond: [{ $ifNull: ['$searchSnapshot.primaryImageUrl', false] }, 1, 0] } },
                newInRange: { $sum: { $cond: [{ $gte: ['$createdAt', since] }, 1, 0] } },
              },
            },
          ],
          byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          byType: [{ $group: { _id: '$developmentType', count: { $sum: 1 } } }],
          topTowns: topValues('address.townCity'),
          topAuthorities: topValues('address.localAuthority'),
          created: [
            { $match: { createdAt: { $gte: since } } },
            { $group: { _id: dayKey('createdAt'), count: { $sum: 1 } } },
          ],
          topOwners: [
            {
              $group: {
                _id: '$owner',
                developments: { $sum: 1 },
                live: { $sum: { $cond: [{ $eq: ['$status', DEVELOPMENT_STATUS.LIVE] }, 1, 0] } },
              },
            },
            { $sort: { developments: -1 } },
            { $limit: 8 },
          ],
          recent: [
            { $sort: { createdAt: -1 } },
            { $limit: 6 },
            {
              $project: {
                name: 1, status: 1, owner: 1, developmentType: 1, createdAt: 1,
                'address.townCity': 1, 'address.postcode': 1, 'searchSnapshot.primaryImageUrl': 1,
              },
            },
          ],
        },
      },
    ]),
    Property.aggregate([
      { $match: { isDeleted: false, ownerType: 'organisation' } },
      { $group: { _id: { $cond: [{ $ifNull: ['$development', false] }, 'linked', 'standalone'] }, count: { $sum: 1 } } },
    ]),
    Property.aggregate([
      { $match: { isDeleted: false, development: { $ne: null } } },
      {
        $group: {
          _id: '$development',
          properties: { $sum: 1 },
          live: { $sum: { $cond: [{ $eq: ['$status', PROPERTY_STATUS.LIVE] }, 1, 0] } },
        },
      },
      { $sort: { properties: -1 } },
      { $limit: 8 },
    ]),
  ]);

  const t = result.totals[0] || {};
  const developments = await Development.find({ _id: { $in: topLinked.map((r) => r._id) } })
    .select('name status owner address.townCity')
    .lean();
  const devById = new Map(developments.map((d) => [String(d._id), d]));
  const linked = linkedRows.find((r) => r._id === 'linked')?.count || 0;
  const standalone = linkedRows.find((r) => r._id === 'standalone')?.count || 0;

  const [topOwners, recent] = await Promise.all([
    withAccounts(result.topOwners, 'owner'),
    withAccounts(result.recent.map(({ owner, ...d }) => ({ _id: owner, development: d })), 'owner'),
  ]);

  return {
    range: { days, since },
    totals: {
      total: t.total || 0,
      live: t.live || 0,
      premium: t.premium || 0,
      homesForLondoners: t.homesForLondoners || 0,
      withImages: t.withImages || 0,
      newInRange: t.newInRange || 0,
      linkedProperties: linked,
      standaloneOrganisationProperties: standalone,
      averagePropertiesPerDevelopment: t.total ? Number((linked / t.total).toFixed(1)) : 0,
    },
    byStatus: countMap(result.byStatus, DEVELOPMENT_STATUS_VALUES),
    byType: breakdown(result.byType),
    topTowns: breakdown(result.topTowns),
    topAuthorities: breakdown(result.topAuthorities),
    createdByDay: fillDays(
      days,
      result.created.map((r) => ({ date: r._id, series: 'developments', count: r.count })),
      ['developments']
    ),
    topOwners,
    mostProperties: topLinked.map(({ _id, ...row }) => ({
      development: devById.get(String(_id)) || { _id, deleted: true },
      ...row,
    })),
    recent: recent.map(({ owner, development }) => ({ ...development, owner })),
  };
};

module.exports = {
  ACCOUNT_ROLES,
  parseRange,
  fillDays,
  dayKey,
  getAccountAnalytics,
  getPropertyAnalytics,
  getDevelopmentAnalytics,
};
