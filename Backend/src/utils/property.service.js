const mongoose = require('mongoose');
const { Property } = require('../models/property');
const ApiError = require('./ApiError');
const {
  isPlainObject,
  isNonEmptyString,
  isValidObjectId,
  escapeRegex,
} = require('./validators');
const { parsePagination, buildPage } = require('./pagination');
const {
  PROPERTY_STATUS,
  PROPERTY_STATUS_VALUES,
  APPROVAL_REQUEST_TYPES,
  REQUIRED_PROPERTY_SECTIONS,
} = require('../common/propertyOptions');
const {
  SECTION_BY_SLUG,
  TAB_MODELS,
  LOCATION_FIELDS,
  ORGANISATION_LOCATION_FIELDS,
  tabFields,
  applyFields,
  normalisers,
} = require('./propertySections');
const { computeCompletion } = require('./propertyCompletion');
const { serializeProperty } = require('./propertySerializer');
const { ACCOUNT_SUMMARY_FIELDS } = require('./profile.service');

/**
 * Every function takes an owner context built by the calling module:
 * {
 *   ownerType: 'user' | 'organisation',
 *   ownerId: id of the listing owner,
 *   actorId: id of the logged-in account making the change,
 *   requiresApproval: true -> complete listings go to the admin queue,
 *                     false -> complete listings go live straight away,
 *   memberId: (optional) limits access to listings this organisation member
 *             created or is assigned to
 * }
 */

const TAB_KEYS = Object.keys(TAB_MODELS);

/** Status changes are automatic only while a listing is in one of these states */
const AUTO_STATUSES = new Set([
  PROPERTY_STATUS.DRAFT,
  PROPERTY_STATUS.PENDING_APPROVAL,
  PROPERTY_STATUS.LIVE,
]);

const LIST_FIELDS = [
  'name',
  'reference',
  'development',
  'address',
  'ownerType',
  'owner',
  'createdBy',
  'assignedTo',
  'status',
  'isPremium',
  'publishedAt',
  'approval',
  'moderation',
  'completion',
  'searchSnapshot',
  'stats',
  'createdAt',
  'updatedAt',
].join(' ');

const SORTABLE_FIELDS = ['createdAt', 'updatedAt', 'name'];

const toObjectId = (id) => new mongoose.Types.ObjectId(String(id));

/** Ids are cast up front because this filter is also used in aggregations */
const ownerFilter = (ctx) => {
  const filter = {
    owner: toObjectId(ctx.ownerId),
    ownerType: ctx.ownerType,
    isDeleted: false,
  };
  if (ctx.memberId) {
    const memberId = toObjectId(ctx.memberId);
    filter.$or = [{ createdBy: memberId }, { assignedTo: memberId }];
  }
  return filter;
};

const findOwnedProperty = async (ctx, propertyId) => {
  if (!isValidObjectId(propertyId)) {
    throw new ApiError(400, 'Invalid property id');
  }
  const property = await Property.findOne({ _id: propertyId, ...ownerFilter(ctx) });
  if (!property) {
    throw new ApiError(404, 'Property not found');
  }
  return property;
};

const loadTabs = async (property, keys = TAB_KEYS) => {
  const docs = await Promise.all(
    keys.map((key) => TAB_MODELS[key].findOne({ property: property._id }).lean())
  );
  return Object.fromEntries(keys.map((key, i) => [key, docs[i]]));
};

const refreshSearchSnapshot = (property, sectionKey, tab) => {
  const snapshot = property.searchSnapshot || {};

  if (sectionKey === 'details') {
    snapshot.schemeType = tab.schemeType;
    snapshot.availability = tab.availability;
    snapshot.propertyType = tab.propertyType;
    snapshot.fullMarketValue = tab.pricing?.fullMarketValue;
    snapshot.minimumSharePercentage = tab.minimumSharePercentage;
  } else if (sectionKey === 'description') {
    snapshot.bedrooms = tab.bedrooms;
  } else if (sectionKey === 'gallery') {
    const images = [...(tab.images || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
    snapshot.primaryImageUrl = (images.find((img) => img.isPrimary) || images[0])?.url;
  }

  property.searchSnapshot = snapshot;
};

/**
 * Incomplete -> draft. Complete -> live (no approval needed) or
 * pending_approval in the admin's create queue (never been live) or
 * edit queue (has been live before). Archived / suspended are left alone.
 */
const syncStatus = (property, completion, ctx) => {
  property.completion = {
    isComplete: completion.isComplete,
    completedSections: completion.completedSections,
    missingSections: completion.missingSections,
  };

  if (!AUTO_STATUSES.has(property.status)) return;

  if (!completion.isComplete) {
    if (property.status === PROPERTY_STATUS.PENDING_APPROVAL) property.approval = undefined;
    property.status = PROPERTY_STATUS.DRAFT;
    return;
  }

  if (!ctx.requiresApproval) {
    property.status = PROPERTY_STATUS.LIVE;
    if (!property.publishedAt) property.publishedAt = new Date();
    return;
  }

  property.status = PROPERTY_STATUS.PENDING_APPROVAL;
  property.approval = {
    requestType: property.publishedAt ? APPROVAL_REQUEST_TYPES.EDIT : APPROVAL_REQUEST_TYPES.CREATE,
    submittedAt: new Date(),
    submittedBy: ctx.actorId,
  };
};

const assertBody = (body) => {
  if (!isPlainObject(body)) {
    throw new ApiError(400, 'Request body must be an object');
  }
};

/** Full listing with every section and a per-section completion report */
const buildFullProperty = async (property) => {
  const tabs = await loadTabs(property);
  const completion = computeCompletion(property.toObject(), tabs);

  return serializeProperty({
    ...property.toObject(),
    ...tabs,
    completion,
  });
};

const getProperty = async (ctx, propertyId) =>
  buildFullProperty(await findOwnedProperty(ctx, propertyId));

/** Any listing by id, whoever owns it. `filter` narrows it, e.g. { ownerType: 'user' } */
const findPropertyById = async (propertyId, filter = {}, notFoundMessage = 'Property not found') => {
  if (!isValidObjectId(propertyId)) {
    throw new ApiError(400, 'Invalid property id');
  }
  const property = await Property.findOne({ _id: propertyId, isDeleted: false, ...filter });
  if (!property) {
    throw new ApiError(404, notFoundMessage);
  }
  return property;
};

const getPropertyById = async (propertyId, filter) =>
  buildFullProperty(await findPropertyById(propertyId, filter));

/**
 * Decides a listing waiting for approval: approved goes live, rejected goes
 * back to draft with the reason. The owner's next complete save resubmits it.
 */
const reviewProperty = async (propertyId, reviewerId, { approve, reason }, filter = {}) => {
  if (!approve && !isNonEmptyString(reason)) {
    throw new ApiError(400, 'reason is required when rejecting');
  }

  const property = await findPropertyById(
    propertyId,
    { ...filter, status: PROPERTY_STATUS.PENDING_APPROVAL },
    'No listing waiting for approval with this id'
  );

  property.approval = {
    ...(property.approval?.toObject() || {}),
    decision: approve ? 'approved' : 'rejected',
    reason: approve ? undefined : reason.trim(),
    reviewedBy: reviewerId,
    reviewedAt: new Date(),
  };
  if (approve) {
    property.status = PROPERTY_STATUS.LIVE;
    if (!property.publishedAt) property.publishedAt = new Date();
  } else {
    property.status = PROPERTY_STATUS.DRAFT;
  }
  await property.save();

  return buildFullProperty(property);
};

/** Soft delete: hidden everywhere, but kept so enquiries still point to it */
const deleteProperty = async (propertyId, actorId, filter = {}) => {
  const property = await findPropertyById(propertyId, filter);
  await Property.updateOne(
    { _id: property._id },
    { $set: { isDeleted: true, deletedAt: new Date(), deletedBy: actorId } }
  );
};

/** Creates a draft from the Location section (name is the only required field) */
const createProperty = async (ctx, body) => {
  assertBody(body);
  const data = await normalisers.location(body, { ctx });

  const property = new Property({
    ownerType: ctx.ownerType,
    owner: ctx.ownerId,
    createdBy: ctx.actorId,
    updatedBy: ctx.actorId,
  });
  applyFields(
    property,
    ctx.ownerType === 'organisation' ? ORGANISATION_LOCATION_FIELDS : LOCATION_FIELDS,
    data
  );

  syncStatus(property, computeCompletion(property.toObject(), {}), ctx);
  await property.save();

  return getProperty(ctx, property._id.toString());
};

/** Saves one section. The section is replaced as a whole with what is sent. */
const saveSection = async (ctx, propertyId, slug, body) => {
  const sectionKey = SECTION_BY_SLUG[slug];
  if (!sectionKey) {
    throw new ApiError(404, `Unknown section. Use one of: ${Object.keys(SECTION_BY_SLUG).join(', ')}`);
  }
  assertBody(body);

  const property = await findOwnedProperty(ctx, propertyId);
  if (property.status === PROPERTY_STATUS.SUSPENDED) {
    throw new ApiError(409, 'This listing has been suspended by an admin and cannot be edited');
  }

  if (sectionKey === 'location') {
    const data = await normalisers.location(body, { ctx, property });
    applyFields(
      property,
      ctx.ownerType === 'organisation' ? ORGANISATION_LOCATION_FIELDS : LOCATION_FIELDS,
      data
    );
  } else {
    const Model = TAB_MODELS[sectionKey];
    const tab = (await Model.findOne({ property: property._id })) || new Model({ property: property._id });
    const data = await normalisers[sectionKey](body, { property, ctx, existing: tab.toObject() });

    applyFields(tab, tabFields(Model), data);
    tab.updatedBy = ctx.actorId;
    await tab.save();

    property[sectionKey] = tab._id;
    refreshSearchSnapshot(property, sectionKey, tab.toObject());
  }

  property.updatedBy = ctx.actorId;
  const tabs = await loadTabs(property);
  syncStatus(property, computeCompletion(property.toObject(), tabs), ctx);
  await property.save();

  return getProperty(ctx, propertyId);
};

/**
 * Listings matching `baseFilter`, narrowed by the query:
 * status, approvalType (create|edit), search, page, limit.
 * Options: `populate` adds owner / creator summaries, `sort` overrides newest-updated first.
 */
const queryProperties = async (baseFilter, query = {}, { populate = false, sort } = {}) => {
  const paging = parsePagination(query);
  const filter = { ...baseFilter };

  if (query.status !== undefined) {
    if (!PROPERTY_STATUS_VALUES.includes(query.status)) {
      throw new ApiError(400, `status must be one of: ${PROPERTY_STATUS_VALUES.join(', ')}`);
    }
    filter.status = query.status;
  }
  if (query.approvalType !== undefined) {
    const types = Object.values(APPROVAL_REQUEST_TYPES);
    if (!types.includes(query.approvalType)) {
      throw new ApiError(400, `approvalType must be one of: ${types.join(', ')}`);
    }
    filter.status = PROPERTY_STATUS.PENDING_APPROVAL;
    filter['approval.requestType'] = query.approvalType;
  }
  if (isNonEmptyString(query.search)) {
    const pattern = new RegExp(escapeRegex(query.search.trim()), 'i');
    filter.$and = [
      ...(filter.$and || []),
      { $or: [{ name: pattern }, { reference: pattern }, { 'address.postcode': pattern }] },
    ];
  }

  let requestedSort;
  if (query.sort !== undefined) {
    if (!SORTABLE_FIELDS.includes(String(query.sort).replace(/^-/, ''))) {
      throw new ApiError(400, `sort must be one of: ${SORTABLE_FIELDS.join(', ')} (prefix with - for descending)`);
    }
    const field = String(query.sort).replace(/^-/, '');
    requestedSort = { [field]: String(query.sort).startsWith('-') ? -1 : 1 };
  }

  let find = Property.find(filter)
    .sort(sort || requestedSort || { updatedAt: -1 })
    .skip(paging.skip)
    .limit(paging.limit)
    .select(LIST_FIELDS);
  if (populate) {
    find = find.populate('owner', ACCOUNT_SUMMARY_FIELDS).populate('createdBy', ACCOUNT_SUMMARY_FIELDS);
  }

  const [items, total] = await Promise.all([find.lean(), Property.countDocuments(filter)]);

  return buildPage(items.map(serializeProperty), total, paging);
};

/** Owner's listings. Filters: status, approvalType (create|edit), search, sort, page, limit */
const listProperties = (ctx, query) => queryProperties(ownerFilter(ctx), query);

const toCountMap = (rows, keys) =>
  Object.fromEntries(
    keys.map((key) => [key, rows.find((row) => row._id === key)?.count || 0])
  );

const toBreakdown = (rows) =>
  rows
    .filter((row) => row._id)
    .map((row) => ({ value: row._id, count: row.count }))
    .sort((a, b) => b.count - a.count);

/** Dashboard numbers for the owner's listings, all computed from Property alone */
const getPropertyAnalytics = async (ctx) => {
  const cardFields = {
    name: 1,
    status: 1,
    isPremium: 1,
    approval: 1,
    completion: 1,
    searchSnapshot: 1,
    stats: 1,
    updatedAt: 1,
  };

  const [result] = await Property.aggregate([
    { $match: ownerFilter(ctx) },
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              premium: { $sum: { $cond: ['$isPremium', 1, 0] } },
              liveViews: {
                $sum: { $cond: [{ $eq: ['$status', PROPERTY_STATUS.LIVE] }, '$stats.views', 0] },
              },
              views: { $sum: '$stats.views' },
              enquiries: { $sum: '$stats.enquiries' },
              incomplete: { $sum: { $cond: ['$completion.isComplete', 0, 1] } },
            },
          },
        ],
        byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
        pendingByType: [
          { $match: { status: PROPERTY_STATUS.PENDING_APPROVAL } },
          { $group: { _id: '$approval.requestType', count: { $sum: 1 } } },
        ],
        bySchemeType: [{ $group: { _id: '$searchSnapshot.schemeType', count: { $sum: 1 } } }],
        byAvailability: [{ $group: { _id: '$searchSnapshot.availability', count: { $sum: 1 } } }],
        missingSections: [
          { $unwind: '$completion.missingSections' },
          { $group: { _id: '$completion.missingSections', count: { $sum: 1 } } },
        ],
        recentlyUpdated: [{ $sort: { updatedAt: -1 } }, { $limit: 5 }, { $project: cardFields }],
        mostViewed: [
          { $match: { 'stats.views': { $gt: 0 } } },
          { $sort: { 'stats.views': -1 } },
          { $limit: 5 },
          { $project: cardFields },
        ],
      },
    },
  ]);

  const totals = result.totals[0] || {};

  return {
    totals: {
      properties: totals.total || 0,
      premium: totals.premium || 0,
      incomplete: totals.incomplete || 0,
      views: totals.views || 0,
      liveViews: totals.liveViews || 0,
      enquiries: totals.enquiries || 0,
      enquiryRate: totals.views ? Number(((totals.enquiries / totals.views) * 100).toFixed(2)) : 0,
    },
    byStatus: toCountMap(result.byStatus, PROPERTY_STATUS_VALUES),
    pendingApproval: toCountMap(result.pendingByType, Object.values(APPROVAL_REQUEST_TYPES)),
    bySchemeType: toBreakdown(result.bySchemeType),
    byAvailability: toBreakdown(result.byAvailability),
    missingSections: toCountMap(result.missingSections, REQUIRED_PROPERTY_SECTIONS),
    recentlyUpdated: result.recentlyUpdated.map(serializeProperty),
    mostViewed: result.mostViewed.map(serializeProperty),
  };
};

module.exports = {
  SECTION_SLUGS: Object.keys(SECTION_BY_SLUG),
  createProperty,
  saveSection,
  getProperty,
  listProperties,
  getPropertyAnalytics,
  queryProperties,
  getPropertyById,
  reviewProperty,
  deleteProperty,
};
