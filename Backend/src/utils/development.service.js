const mongoose = require('mongoose');
const { Development } = require('../models/development');
const { Property } = require('../models/property');
const ApiError = require('./ApiError');
const { ACCOUNT_SUMMARY_FIELDS } = require('./profile.service');
const {
  isPlainObject,
  isNonEmptyString,
  isValidObjectId,
  escapeRegex,
} = require('./validators');
const { parsePagination, buildPage } = require('./pagination');
const {
  DEVELOPMENT_STATUS,
  DEVELOPMENT_STATUS_VALUES,
} = require('../common/developmentOptions');
const { tabFields, applyFields } = require('./propertySections');
const {
  SECTION_BY_SLUG,
  TAB_MODELS,
  DEVELOPMENT_FIELDS,
  missingToPublish,
  normalisers,
} = require('./developmentSections');

/**
 * Every function takes an owner context built by the calling module:
 * {
 *   ownerId: the organisation that owns the development,
 *   actorId: id of the logged-in account making the change,
 *   requiresApproval: true -> publishing only submits for approval, and edits
 *                     to a live development send it back for approval,
 *   memberId: (optional) limits access to developments this organisation
 *             member created or is assigned to
 * }
 */

const TAB_KEYS = Object.keys(TAB_MODELS);

const LIST_FIELDS = [
  'name',
  'developmentType',
  'address',
  'owner',
  'createdBy',
  'assignedTo',
  'status',
  'isPremium',
  'publishedAt',
  'syndication',
  'moderation',
  'searchSnapshot',
  'createdAt',
  'updatedAt',
].join(' ');

const toObjectId = (id) => new mongoose.Types.ObjectId(String(id));

/** Ids are cast up front because this filter is also used in aggregations */
const ownerFilter = (ctx) => {
  const filter = { owner: toObjectId(ctx.ownerId), isDeleted: false };
  if (ctx.memberId) {
    const memberId = toObjectId(ctx.memberId);
    filter.$or = [{ createdBy: memberId }, { assignedTo: memberId }];
  }
  return filter;
};

const findOwnedDevelopment = async (ctx, developmentId) => {
  if (!isValidObjectId(developmentId)) {
    throw new ApiError(400, 'Invalid development id');
  }
  const development = await Development.findOne({ _id: developmentId, ...ownerFilter(ctx) });
  if (!development) {
    throw new ApiError(404, 'Development not found');
  }
  return development;
};

const assertBody = (body) => {
  if (!isPlainObject(body)) {
    throw new ApiError(400, 'Request body must be an object');
  }
};

/** Full development with every tab (null until saved) and what is still needed to publish */
const withTabs = async (development) => {
  const docs = await Promise.all(
    TAB_KEYS.map((key) => TAB_MODELS[key].findOne({ development: development._id }).lean())
  );
  const missingFields = missingToPublish(development);
  const { __v, ...plain } = development.toObject();

  return {
    ...plain,
    ...Object.fromEntries(TAB_KEYS.map((key, i) => [key, docs[i]])),
    readiness: { canPublish: missingFields.length === 0, missingFields },
  };
};

const refreshPrimaryImage = (development, imagesTab) => {
  const images = [...(imagesTab.images || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
  development.set(
    'searchSnapshot.primaryImageUrl',
    (images.find((img) => img.isPrimary) || images[0])?.url
  );
};

/**
 * After a content edit: a live / pending development that can no longer be
 * published goes back to draft, and with approval, editing a live one sends
 * it back for review. Drafts, archived and suspended are left alone.
 */
const syncStatusAfterEdit = (development, ctx) => {
  const { status } = development;
  if (status !== DEVELOPMENT_STATUS.LIVE && status !== DEVELOPMENT_STATUS.PENDING_APPROVAL) return;

  if (missingToPublish(development).length) {
    development.status = DEVELOPMENT_STATUS.DRAFT;
    return;
  }
  if (ctx.requiresApproval && status === DEVELOPMENT_STATUS.LIVE) {
    development.status = DEVELOPMENT_STATUS.PENDING_APPROVAL;
  }
};

/**
 * "Publish on STB" / "Publish on Homes For Londoners" toggles.
 * Body: { publish: boolean, homesForLondoners?: boolean }
 */
const applyPublishing = (development, body, ctx) => {
  const { publish, homesForLondoners = false } = body;
  if (typeof publish !== 'boolean') {
    throw new ApiError(400, 'publish must be true or false');
  }
  if (typeof homesForLondoners !== 'boolean') {
    throw new ApiError(400, 'homesForLondoners must be true or false');
  }

  const { status } = development;
  const syndicationChanged =
    Boolean(development.syndication?.homesForLondoners) !== homesForLondoners;

  if (ctx.requiresApproval && status === DEVELOPMENT_STATUS.ARCHIVED) {
    throw new ApiError(409, 'This development is archived. Ask your organisation to relist it');
  }
  if (ctx.requiresApproval && !publish && status === DEVELOPMENT_STATUS.LIVE) {
    throw new ApiError(403, 'Only your organisation can unpublish a live development');
  }

  if (publish) {
    const missingFields = missingToPublish(development);
    if (missingFields.length) {
      throw new ApiError(400, 'Complete the development details before publishing', missingFields);
    }
  }

  development.set('syndication.homesForLondoners', homesForLondoners);

  if (!publish) {
    development.status = DEVELOPMENT_STATUS.DRAFT;
  } else if (!ctx.requiresApproval) {
    development.status = DEVELOPMENT_STATUS.LIVE;
    if (!development.publishedAt) development.publishedAt = new Date();
  } else if (status !== DEVELOPMENT_STATUS.LIVE || syndicationChanged) {
    development.status = DEVELOPMENT_STATUS.PENDING_APPROVAL;
  }
};

const getDevelopment = async (ctx, developmentId) =>
  withTabs(await findOwnedDevelopment(ctx, developmentId));

/** Creates a draft from the Development tab (name is the only required field) */
const createDevelopment = async (ctx, body) => {
  assertBody(body);
  const data = await normalisers.development(body);

  const development = new Development({
    owner: ctx.ownerId,
    createdBy: ctx.actorId,
    updatedBy: ctx.actorId,
  });
  applyFields(development, DEVELOPMENT_FIELDS, data);
  await development.save();

  return withTabs(development);
};

/** Saves one section. The section is replaced as a whole with what is sent. */
const saveSection = async (ctx, developmentId, slug, body) => {
  const sectionKey = SECTION_BY_SLUG[slug];
  if (!sectionKey) {
    throw new ApiError(404, `Unknown section. Use one of: ${Object.keys(SECTION_BY_SLUG).join(', ')}`);
  }
  assertBody(body);

  const development = await findOwnedDevelopment(ctx, developmentId);
  if (development.status === DEVELOPMENT_STATUS.SUSPENDED) {
    throw new ApiError(409, 'This development has been suspended by an admin and cannot be edited');
  }

  if (sectionKey === 'publishing') {
    applyPublishing(development, body, ctx);
  } else {
    if (sectionKey === 'development') {
      applyFields(development, DEVELOPMENT_FIELDS, await normalisers.development(body));
    } else {
      const Model = TAB_MODELS[sectionKey];
      const tab =
        (await Model.findOne({ development: development._id })) ||
        new Model({ development: development._id });
      const data = await normalisers[sectionKey](body, {
        development,
        ctx,
        existing: tab.toObject(),
      });

      applyFields(tab, tabFields(Model), data);
      tab.updatedBy = ctx.actorId;
      await tab.save();

      development[sectionKey] = tab._id;
      if (sectionKey === 'images') refreshPrimaryImage(development, tab.toObject());
    }
    syncStatusAfterEdit(development, ctx);
  }

  development.updatedBy = ctx.actorId;
  await development.save();

  return withTabs(development);
};

/**
 * Developments matching `baseFilter`, narrowed by the query: status, search
 * (name / postcode), page, limit. `populate` adds owner / creator summaries.
 */
const queryDevelopments = async (baseFilter, query = {}, { populate = false } = {}) => {
  const paging = parsePagination(query);
  const filter = { ...baseFilter };

  if (query.status !== undefined) {
    if (!DEVELOPMENT_STATUS_VALUES.includes(query.status)) {
      throw new ApiError(400, `status must be one of: ${DEVELOPMENT_STATUS_VALUES.join(', ')}`);
    }
    filter.status = query.status;
  }
  if (isNonEmptyString(query.search)) {
    const pattern = new RegExp(escapeRegex(query.search.trim()), 'i');
    filter.$and = [
      ...(filter.$and || []),
      { $or: [{ name: pattern }, { 'address.postcode': pattern }] },
    ];
  }

  let find = Development.find(filter)
    .sort({ updatedAt: -1 })
    .skip(paging.skip)
    .limit(paging.limit)
    .select(LIST_FIELDS);
  if (populate) {
    find = find.populate('owner', ACCOUNT_SUMMARY_FIELDS).populate('createdBy', ACCOUNT_SUMMARY_FIELDS);
  }

  const [items, total] = await Promise.all([find.lean(), Development.countDocuments(filter)]);

  return buildPage(items, total, paging);
};

/** Owner's developments. Filters: status, search (name / postcode), page, limit */
const listDevelopments = (ctx, query) => queryDevelopments(ownerFilter(ctx), query);

/** Any development by id, whoever owns it */
const findDevelopmentById = async (developmentId) => {
  if (!isValidObjectId(developmentId)) {
    throw new ApiError(400, 'Invalid development id');
  }
  const development = await Development.findOne({ _id: developmentId, isDeleted: false });
  if (!development) {
    throw new ApiError(404, 'Development not found');
  }
  return development;
};

const getDevelopmentById = async (developmentId) =>
  withTabs(await findDevelopmentById(developmentId));

/**
 * Soft delete. Its homes stay listed as standalone properties, so they no
 * longer pick up the development's tour, brochures or site plan.
 */
const softDelete = (development, actorId) =>
  Promise.all([
    Development.updateOne(
      { _id: development._id },
      { $set: { isDeleted: true, deletedAt: new Date(), deletedBy: actorId } }
    ),
    Property.updateMany({ development: development._id }, { $set: { development: null } }),
  ]);

const deleteDevelopment = async (developmentId, actorId) =>
  softDelete(await findDevelopmentById(developmentId), actorId);

/** Same as deleteDevelopment, limited to the owner context's developments */
const deleteOwnedDevelopment = async (ctx, developmentId) =>
  softDelete(await findOwnedDevelopment(ctx, developmentId), ctx.actorId);

/** Dashboard counts: total and per status */
const getDevelopmentCounts = async (ctx) => {
  const rows = await Development.aggregate([
    { $match: ownerFilter(ctx) },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  return {
    total: rows.reduce((sum, row) => sum + row.count, 0),
    byStatus: Object.fromEntries(
      DEVELOPMENT_STATUS_VALUES.map((status) => [
        status,
        rows.find((row) => row._id === status)?.count || 0,
      ])
    ),
  };
};

module.exports = {
  SECTION_SLUGS: Object.keys(SECTION_BY_SLUG),
  createDevelopment,
  saveSection,
  getDevelopment,
  listDevelopments,
  getDevelopmentCounts,
  queryDevelopments,
  getDevelopmentById,
  deleteDevelopment,
  deleteOwnedDevelopment,
};
