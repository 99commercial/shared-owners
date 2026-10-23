const mongoose = require('mongoose');
const User = require('../../../models/User');
const { Property } = require('../../../models/property');
const { Development } = require('../../../models/development');
const ApiError = require('../../../utils/ApiError');
const { ROLES } = require('../../../common/roles');
const { PROPERTY_STATUS } = require('../../../common/propertyOptions');
const { DEVELOPMENT_STATUS } = require('../../../common/developmentOptions');
const { parsePagination, buildPage } = require('../../../utils/pagination');
const { escapeRegex } = require('../../../utils/validators');
const { poundsToPence } = require('../../../utils/money');
const { serializeProperty } = require('../../../utils/propertySerializer');

// Fields to expose publicly for a property listing card
const PROPERTY_LIST_FIELDS = [
  'name', 'reference', 'address', 'location', 'status', 'ownerType',
  'searchSnapshot', 'isPremium', 'publishedAt', 'createdAt',
  'owner', 'development',
];

// Fields to expose publicly for a development listing card
const DEVELOPMENT_LIST_FIELDS = [
  'name', 'developmentType', 'address', 'location', 'status',
  'searchSnapshot', 'isPremium', 'publishedAt', 'createdAt', 'owner',
];

/** Only what a listing card needs; never the owner's login email */
const OWNER_CARD_FIELDS = 'role organisationProfile.name organisationProfile.slug organisationProfile.logoUrl';
const OWNER_DETAIL_FIELDS = [
  'role',
  'organisationProfile.name', 'organisationProfile.slug', 'organisationProfile.logoUrl',
  'organisationProfile.type', 'organisationProfile.phone', 'organisationProfile.contactEmail',
  'organisationProfile.website',
  'userProfile.firstName', 'userProfile.phone', 'email',
].join(' ');

const FILE_FIELDS = (file) => file && {
  url: file.url, fileName: file.fileName, mimeType: file.mimeType, sizeBytes: file.sizeBytes,
};

// Public organisation summary fields
const ORG_LIST_FIELDS =
  'email organisationProfile isActive createdAt';

const LIVE_PROPERTY = { status: PROPERTY_STATUS.LIVE, isDeleted: false };
const LIVE_DEVELOPMENT = { status: DEVELOPMENT_STATUS.LIVE, isDeleted: false };

const PROPERTY_SORTS = {
  newest: { isPremium: -1, publishedAt: -1, _id: -1 },
  price_asc: { 'searchSnapshot.fullMarketValue': 1, _id: -1 },
  price_desc: { 'searchSnapshot.fullMarketValue': -1, _id: -1 },
};
const DEVELOPMENT_SORTS = {
  newest: { isPremium: -1, publishedAt: -1, createdAt: -1 },
  name: { name: 1 },
};

const isObjectId = (value) => mongoose.isValidObjectId(value) && String(new mongoose.Types.ObjectId(value)) === value;

const addressSearch = (search) => {
  const rx = new RegExp(escapeRegex(String(search).trim()), 'i');
  return [
    { name: rx },
    { reference: rx },
    { 'address.line1': rx },
    { 'address.townCity': rx },
    { 'address.localAuthority': rx },
    { 'address.postcode': rx },
  ];
};

/**
 * Who a buyer should contact. Listing overrides win, then the organisation's
 * public contact details, then (for private sellers) their own details.
 */
const buildContact = (owner, overrides = {}) => {
  if (!owner) return null;
  if (owner.role === ROLES.ORGANISATION) {
    const p = owner.organisationProfile || {};
    return {
      kind: 'organisation',
      name: p.name,
      slug: p.slug,
      logoUrl: p.logoUrl,
      type: p.type,
      website: p.website,
      phone: overrides.phone || p.phone,
      email: overrides.email || p.contactEmail,
    };
  }
  return {
    kind: 'private',
    name: owner.userProfile?.firstName || 'Private seller',
    phone: overrides.phone || owner.userProfile?.phone,
    email: overrides.email || owner.email,
  };
};

/** ── Properties ────────────────────────────────────────────────────────── */

const buildPropertyFilter = (query) => {
  const filter = { ...LIVE_PROPERTY };

  if (query.schemeType) filter['searchSnapshot.schemeType'] = String(query.schemeType);
  if (query.availability) filter['searchSnapshot.availability'] = String(query.availability);
  if (query.propertyType) filter['searchSnapshot.propertyType'] = String(query.propertyType);
  if (query.bedrooms !== undefined && query.bedrooms !== '') {
    const beds = Number(query.bedrooms);
    if (!Number.isInteger(beds) || beds < 0) throw new ApiError(400, 'bedrooms must be a whole number');
    filter['searchSnapshot.bedrooms'] = beds === 0 ? 0 : { $gte: beds };
  }
  const minPrice = poundsToPence(query.minPrice, 'minPrice');
  const maxPrice = poundsToPence(query.maxPrice, 'maxPrice');
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter['searchSnapshot.fullMarketValue'] = {
      ...(minPrice !== undefined && { $gte: minPrice }),
      ...(maxPrice !== undefined && { $lte: maxPrice }),
    };
  }
  if (query.minShare) filter['searchSnapshot.minimumSharePercentage'] = { $gte: Number(query.minShare) };
  if (query.development) {
    if (!isObjectId(query.development)) throw new ApiError(400, 'development must be an id');
    filter.development = query.development;
  }
  if (query.owner) {
    if (!isObjectId(query.owner)) throw new ApiError(400, 'owner must be an id');
    filter.owner = query.owner;
  }
  if (query.postcode) {
    filter['address.postcode'] = new RegExp(`^${escapeRegex(String(query.postcode).toUpperCase())}`, 'i');
  }
  if (query.search && String(query.search).trim()) filter.$or = addressSearch(query.search);

  return filter;
};

const findPropertyCards = (filter, { sort = PROPERTY_SORTS.newest, skip = 0, limit }) =>
  Property.find(filter)
    .select(PROPERTY_LIST_FIELDS.join(' '))
    .populate('owner', OWNER_CARD_FIELDS)
    .populate('development', 'name')
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean()
    .then((items) => items.map(serializeProperty));

/** Query: search, schemeType, availability, propertyType, bedrooms (n+), minPrice / maxPrice (pounds),
 * minShare, development, owner, postcode, sort (newest | price_asc | price_desc), page, limit */
const listProperties = async (query = {}) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = buildPropertyFilter(query);
  const sort = PROPERTY_SORTS[query.sort] || PROPERTY_SORTS.newest;

  const [properties, total] = await Promise.all([
    findPropertyCards(filter, { sort, skip, limit }),
    Property.countDocuments(filter),
  ]);

  return buildPage(properties, total, { page, limit });
};

const propertyDocuments = (attachments, devDetails) => {
  const a = attachments || {};
  const useDevBrochures = devDetails?.applyBrochuresToProperties && devDetails.brochures?.length;
  const useDevSitePlan = devDetails?.applySitePlanToProperties && devDetails.sitePlan;
  const brochures = (useDevBrochures ? devDetails.brochures : a.brochures || []).map(FILE_FIELDS);
  return {
    brochures,
    energyCertificate: FILE_FIELDS(a.energyCertificate),
    floorPlan: FILE_FIELDS(a.floorPlan),
    priceList: FILE_FIELDS(a.priceList || devDetails?.priceList),
    sitePlan: FILE_FIELDS(useDevSitePlan ? devDetails.sitePlan : a.sitePlan),
    keyInformationDocument: FILE_FIELDS(a.keyInformationDocument),
    keyInformationUrl: a.keyInformationUrl,
  };
};

const getProperty = async (propertyId) => {
  if (!isObjectId(propertyId)) throw new ApiError(404, 'Property not found');

  const property = await Property.findOneAndUpdate(
    { _id: propertyId, ...LIVE_PROPERTY },
    { $inc: { 'stats.views': 1 } },
    { new: true, timestamps: false }
  )
    .select('-moderation -approval -completion -createdBy -updatedBy -assignedTo -isDeleted -deletedAt -deletedBy -stats')
    .populate('owner', OWNER_DETAIL_FIELDS)
    .populate('details')
    .populate('description')
    .populate('eligibility')
    .populate('gallery')
    .populate('videoTour')
    .populate('attachments')
    .populate('extras')
    .populate('enquiryContacts')
    .populate({
      path: 'development',
      match: LIVE_DEVELOPMENT,
      select: 'name address developmentType searchSnapshot details',
      populate: { path: 'details', select: 'virtualTourSupplier virtualTourUrl applyVirtualTourToProperties brochures sitePlan priceList applyBrochuresToProperties applySitePlanToProperties salesTelephone salesEmail' },
    })
    .lean();

  if (!property) throw new ApiError(404, 'Property not found');

  const devDetails = property.development?.details;
  const contacts = property.enquiryContacts || {};
  const contact = buildContact(property.owner, {
    phone: contacts.salesTelephone || devDetails?.salesTelephone,
    email: contacts.salesEmail || devDetails?.salesEmail,
  });

  const tour = { ...(property.videoTour || {}) };
  if (!tour.virtualTourUrl && devDetails?.applyVirtualTourToProperties && devDetails.virtualTourUrl) {
    tour.virtualTourUrl = devDetails.virtualTourUrl;
    tour.virtualTourSupplier = devDetails.virtualTourSupplier;
  }

  const extras = property.extras || {};
  const announcementLive = extras.announcement
    && (!extras.announcementEndDate || new Date(extras.announcementEndDate) > new Date());

  const result = serializeProperty({
    ...property,
    owner: undefined,
    enquiryContacts: undefined,
    attachments: undefined,
    extras: undefined,
    videoTour: tour,
    documents: propertyDocuments(property.attachments, devDetails),
    announcement: announcementLive ? extras.announcement : null,
    gallery: (property.gallery?.images || [])
      .slice()
      .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || (a.order ?? 0) - (b.order ?? 0))
      .map((img) => ({ url: img.url, caption: img.caption })),
    development: property.development
      ? {
        _id: property.development._id,
        name: property.development.name,
        address: property.development.address,
        developmentType: property.development.developmentType,
        primaryImageUrl: property.development.searchSnapshot?.primaryImageUrl,
      }
      : null,
  });
  delete result.owner;
  delete result.enquiryContacts;
  delete result.attachments;
  delete result.extras;

  // Similar homes: same development first, then the same town
  const nearby = property.development
    ? { development: property.development._id }
    : property.address?.townCity
      ? { 'address.townCity': property.address.townCity }
      : { owner: property.owner?._id };
  const related = await findPropertyCards(
    { ...LIVE_PROPERTY, ...nearby, _id: { $ne: property._id } },
    { limit: 3 }
  );

  return { property: result, contact, related };
};

/** ── Developments ──────────────────────────────────────────────────────── */

/** Live homes per development: count and cheapest full market value (pounds) */
const homesSummary = async (developmentIds) => {
  if (!developmentIds.length) return new Map();
  const rows = await Property.aggregate([
    { $match: { ...LIVE_PROPERTY, development: { $in: developmentIds } } },
    {
      $group: {
        _id: '$development',
        homes: { $sum: 1 },
        available: { $sum: { $cond: [{ $eq: ['$searchSnapshot.availability', 'available'] }, 1, 0] } },
        priceFrom: { $min: '$searchSnapshot.fullMarketValue' },
        priceTo: { $max: '$searchSnapshot.fullMarketValue' },
        minShare: { $min: '$searchSnapshot.minimumSharePercentage' },
        bedroomsMin: { $min: '$searchSnapshot.bedrooms' },
        bedroomsMax: { $max: '$searchSnapshot.bedrooms' },
      },
    },
  ]);
  return new Map(rows.map((r) => [String(r._id), {
    homes: r.homes,
    available: r.available,
    priceFrom: r.priceFrom == null ? null : r.priceFrom / 100,
    priceTo: r.priceTo == null ? null : r.priceTo / 100,
    minShare: r.minShare ?? null,
    bedroomsMin: r.bedroomsMin ?? null,
    bedroomsMax: r.bedroomsMax ?? null,
  }]));
};

const EMPTY_SUMMARY = { homes: 0, available: 0, priceFrom: null, priceTo: null, minShare: null, bedroomsMin: null, bedroomsMax: null };

/** Query: search, developmentType, postcode, owner, sort (newest | name), page, limit */
const listDevelopments = async (query = {}) => {
  const { page, limit, skip } = parsePagination(query);

  const filter = { ...LIVE_DEVELOPMENT };
  if (query.developmentType) filter.developmentType = String(query.developmentType);
  if (query.owner) {
    if (!isObjectId(query.owner)) throw new ApiError(400, 'owner must be an id');
    filter.owner = query.owner;
  }
  if (query.postcode) {
    filter['address.postcode'] = new RegExp(`^${escapeRegex(String(query.postcode).toUpperCase())}`, 'i');
  }
  if (query.search && String(query.search).trim()) {
    filter.$or = addressSearch(query.search).filter((c) => !('reference' in c));
  }

  const [developments, total] = await Promise.all([
    Development.find(filter)
      .select(DEVELOPMENT_LIST_FIELDS.join(' '))
      .populate('owner', OWNER_CARD_FIELDS)
      .sort(DEVELOPMENT_SORTS[query.sort] || DEVELOPMENT_SORTS.newest)
      .skip(skip)
      .limit(limit)
      .lean(),
    Development.countDocuments(filter),
  ]);

  const summary = await homesSummary(developments.map((d) => d._id));
  const items = developments.map((d) => ({ ...d, homes: summary.get(String(d._id)) || EMPTY_SUMMARY }));

  return buildPage(items, total, { page, limit });
};

const getDevelopment = async (developmentId) => {
  if (!isObjectId(developmentId)) throw new ApiError(404, 'Development not found');

  const development = await Development.findOne({ _id: developmentId, ...LIVE_DEVELOPMENT })
    .select('-moderation -createdBy -updatedBy -assignedTo -isDeleted -deletedAt -deletedBy -syndication')
    .populate('owner', OWNER_DETAIL_FIELDS)
    .populate('details')
    .populate('images')
    .populate('extras')
    .lean();

  if (!development) throw new ApiError(404, 'Development not found');

  const details = development.details || {};
  const contact = buildContact(development.owner, { phone: details.salesTelephone, email: details.salesEmail });
  const banners = (development.images?.bannerImages || []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const gallery = (development.images?.images || [])
    .slice()
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || (a.order ?? 0) - (b.order ?? 0));

  const [homes, summary] = await Promise.all([
    findPropertyCards({ ...LIVE_PROPERTY, development: development._id }, { sort: PROPERTY_SORTS.price_asc, limit: 100 }),
    homesSummary([development._id]),
  ]);

  const result = {
    ...development,
    owner: undefined,
    images: undefined,
    summaryText: development.extras?.summaryText || null,
    extras: undefined,
    gallery: [...banners, ...gallery].map((img) => ({ url: img.url, caption: img.caption })),
    details: {
      description: details.description,
      virtualTourSupplier: details.virtualTourSupplier,
      virtualTourUrl: details.virtualTourUrl,
      videoProvider: details.videoProvider,
      videoUrl: details.videoUrl,
    },
    documents: {
      brochures: (details.brochures || []).map(FILE_FIELDS),
      sitePlan: FILE_FIELDS(details.sitePlan),
      priceList: FILE_FIELDS(details.priceList),
    },
    homes: summary.get(String(development._id)) || EMPTY_SUMMARY,
  };
  delete result.owner;
  delete result.images;
  delete result.extras;

  return { development: result, contact, properties: homes };
};

/** ── Organisations ─────────────────────────────────────────────────────── */

const listOrganisations = async (query = {}) => {
  const { page, limit, skip } = parsePagination(query);

  const filter = { role: ROLES.ORGANISATION, isActive: true };

  if (query.type) filter['organisationProfile.type'] = query.type;
  if (query.search) {
    filter['organisationProfile.name'] = new RegExp(escapeRegex(query.search), 'i');
  }

  const [organisations, total] = await Promise.all([
    User.find(filter)
      .select(ORG_LIST_FIELDS)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  return buildPage(organisations, total, { page, limit });
};

const getOrganisation = async (slug) => {
  const organisation = await User.findOne({
    role: ROLES.ORGANISATION,
    isActive: true,
    'organisationProfile.slug': slug,
  })
    .select(ORG_LIST_FIELDS)
    .lean();

  if (!organisation) throw new ApiError(404, 'Organisation not found');

  // Also get live property count
  const propertyCount = await Property.countDocuments({
    owner: organisation._id,
    ownerType: 'organisation',
    ...LIVE_PROPERTY,
  });

  return { organisation, propertyCount };
};

module.exports = {
  listProperties,
  getProperty,
  listDevelopments,
  getDevelopment,
  listOrganisations,
  getOrganisation,
};
