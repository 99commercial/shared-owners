const {
  PropertyDetails,
  PropertyDescription,
  PropertyEligibility,
  PropertyGallery,
  PropertyVideoTour,
  PropertyAttachments,
  PropertyExtras,
  PropertyEnquiryContacts,
} = require('../models/property');
const { Development, DevelopmentDetails } = require('../models/development');
const ApiError = require('./ApiError');
const { poundsToPence } = require('./money');
const { sanitizeRichText } = require('./richText');
const {
  isNonEmptyString,
  isPlainObject,
  isValidObjectId,
  pick,
} = require('./validators');
const { ELIGIBILITY_CRITERIA } = require('../common/propertyOptions');

/** URL slug -> section key (the key is also the ref field name on Property) */
const SECTION_BY_SLUG = Object.freeze({
  location: 'location',
  details: 'details',
  description: 'description',
  eligibility: 'eligibility',
  gallery: 'gallery',
  'video-tour': 'videoTour',
  attachments: 'attachments',
  extras: 'extras',
  'enquiry-contacts': 'enquiryContacts',
});

/** Every section except location is stored in its own collection */
const TAB_MODELS = Object.freeze({
  details: PropertyDetails,
  description: PropertyDescription,
  eligibility: PropertyEligibility,
  gallery: PropertyGallery,
  videoTour: PropertyVideoTour,
  attachments: PropertyAttachments,
  extras: PropertyExtras,
  enquiryContacts: PropertyEnquiryContacts,
});

const LOCATION_FIELDS = Object.freeze(['name', 'reference', 'address', 'location']);
const ORGANISATION_LOCATION_FIELDS = Object.freeze([...LOCATION_FIELDS, 'development']);

const SYSTEM_FIELDS = new Set([
  '_id',
  '__v',
  'property',
  'development',
  'updatedBy',
  'createdAt',
  'updatedAt',
]);

/** Sets each field to its new value, or back to the schema default when not provided */
const applyFields = (doc, fields, data) => {
  const defaults = new doc.constructor().toObject();
  fields.forEach((field) => {
    doc.set(field, data[field] !== undefined ? data[field] : defaults[field]);
  });
};

/** Top-level fields of a tab schema that the client may set */
const tabFields = (Model) =>
  [...new Set(Object.keys(Model.schema.paths).map((path) => path.split('.')[0]))].filter(
    (field) => !SYSTEM_FIELDS.has(field)
  );

const PRICING_FIELDS = Object.freeze([
  'fullMarketValue',
  'monthlyRentAtMinShare',
  'serviceChargeMonthly',
  'groundRentAnnual',
  'monthlyRent',
]);

const MONEY_CRITERIA = new Set(['max_household_income', 'min_household_income', 'min_deposit']);
const NUMBER_CRITERIA = new Set(['min_age']);
const TEXT_CRITERIA = new Set(['local_connection', 'live_or_work_in_area']);

const FILE_INPUT_FIELDS = Object.freeze(['url', 'storageKey', 'fileName', 'mimeType', 'sizeBytes']);
const IMAGE_INPUT_FIELDS = Object.freeze([...FILE_INPUT_FIELDS, 'caption', 'order', 'isPrimary']);
const SINGLE_DOCUMENT_FIELDS = Object.freeze([
  'priceList',
  'floorPlan',
  'energyCertificate',
  'sitePlan',
  'keyInformationDocument',
]);

const requirePremium = (property, feature) => {
  if (!property.isPremium) {
    throw new ApiError(403, `${feature} is only available on premium listings`);
  }
};

/** Keeps the original uploader / upload time for files that were already on the tab */
const withUploadMeta = (file, existingFiles, actorId, fields, label) => {
  if (!isPlainObject(file) || !isNonEmptyString(file.url)) {
    throw new ApiError(400, `${label} must be an object with a url`);
  }
  const previous = existingFiles.find((f) => f && f.url === file.url);
  return {
    ...pick(file, fields),
    uploadedBy: previous?.uploadedBy || actorId,
    uploadedAt: previous?.uploadedAt || new Date(),
  };
};

const mapFiles = (files, existingFiles, actorId, fields, label) => {
  if (files === undefined || files === null) return undefined;
  if (!Array.isArray(files)) {
    throw new ApiError(400, `${label} must be an array`);
  }
  return files.map((file, i) => withUploadMeta(file, existingFiles, actorId, fields, `${label}[${i}]`));
};

const normaliseCriterion = (criterion, index) => {
  if (!isPlainObject(criterion) || !ELIGIBILITY_CRITERIA.includes(criterion.type)) {
    throw new ApiError(400, `criteria[${index}].type must be one of: ${ELIGIBILITY_CRITERIA.join(', ')}`);
  }

  const { type, value } = criterion;
  const label = `criteria[${index}].value`;

  if (MONEY_CRITERIA.has(type)) {
    const pence = poundsToPence(value, label);
    if (pence === undefined) throw new ApiError(400, `${label} is required`);
    return { type, value: pence };
  }
  if (NUMBER_CRITERIA.has(type)) {
    if (!Number.isInteger(value) || value < 0 || value > 120) {
      throw new ApiError(400, `${label} must be a whole number between 0 and 120`);
    }
    return { type, value };
  }
  if (TEXT_CRITERIA.has(type)) {
    if (!isNonEmptyString(value)) throw new ApiError(400, `${label} must be text`);
    return { type, value: value.trim() };
  }
  if (typeof value !== 'boolean') {
    throw new ApiError(400, `${label} must be true or false`);
  }
  return { type, value };
};

/** Shared by property and development basic details: name, address and map pin */
const normaliseNameAndPlace = (data) => {
  if (!isNonEmptyString(data.name)) {
    throw new ApiError(400, 'name is required');
  }

  if (data.address !== undefined && data.address !== null && !isPlainObject(data.address)) {
    throw new ApiError(400, 'address must be an object');
  }
  if (data.address === null) data.address = undefined;

  if (data.location !== undefined && data.location !== null) {
    if (!isPlainObject(data.location) || !Array.isArray(data.location.coordinates)) {
      throw new ApiError(400, 'location must be { "type": "Point", "coordinates": [longitude, latitude] }');
    }
    data.location = { type: 'Point', coordinates: data.location.coordinates };
  } else {
    data.location = undefined;
  }

  return data;
};

/**
 * Turns a request body into the values to store for one section.
 * Each returns only whitelisted fields; anything not returned is cleared,
 * because saving a section replaces it as a whole.
 */
const normalisers = {
  async location(body, { ctx, property }) {
    const fields = ctx.ownerType === 'organisation' ? ORGANISATION_LOCATION_FIELDS : LOCATION_FIELDS;
    const data = normaliseNameAndPlace(pick(body, fields));

    if (data.reference === '' || data.reference === null) data.reference = undefined;

    const unchanged = property?.development && String(property.development) === String(data.development);
    if (data.development && !unchanged) {
      if (!isValidObjectId(data.development)) {
        throw new ApiError(400, 'Invalid development id');
      }
      const filter = { _id: data.development, owner: ctx.ownerId, isDeleted: false };
      if (ctx.memberId) filter.$or = [{ createdBy: ctx.memberId }, { assignedTo: ctx.memberId }];

      if (!(await Development.exists(filter))) {
        throw new ApiError(400, 'Development not found for this organisation');
      }
    } else if (!data.development) {
      data.development = undefined;
    }

    return data;
  },

  async details(body, { property }) {
    const data = pick(body, tabFields(PropertyDetails));

    if (data.pricing !== undefined && data.pricing !== null) {
      if (!isPlainObject(data.pricing)) throw new ApiError(400, 'pricing must be an object');
      const pricing = pick(data.pricing, [...PRICING_FIELDS, 'discountPercentage']);
      PRICING_FIELDS.forEach((field) => {
        if (pricing[field] !== undefined) pricing[field] = poundsToPence(pricing[field], `pricing.${field}`);
      });
      data.pricing = pricing;
    }

    if (data.materials !== undefined) data.materials = sanitizeRichText(data.materials);
    if (Array.isArray(data.faqs) && data.faqs.length) requirePremium(property, 'FAQs');

    return data;
  },

  async description(body) {
    const data = pick(body, tabFields(PropertyDescription));
    ['description', 'keyFeatures'].forEach((field) => {
      if (data[field] !== undefined) data[field] = sanitizeRichText(data[field]);
    });
    return data;
  },

  async eligibility(body) {
    const data = pick(body, tabFields(PropertyEligibility));

    if (data.criteria !== undefined && data.criteria !== null) {
      if (!Array.isArray(data.criteria)) throw new ApiError(400, 'criteria must be an array');
      data.criteria = data.criteria.map(normaliseCriterion);
    }
    if (data.criteriaText !== undefined) data.criteriaText = sanitizeRichText(data.criteriaText);

    return data;
  },

  async gallery(body, { ctx, existing }) {
    const data = pick(body, tabFields(PropertyGallery));
    data.images = mapFiles(data.images, existing.images || [], ctx.actorId, IMAGE_INPUT_FIELDS, 'images');
    return data;
  },

  async videoTour(body, { property }) {
    const data = pick(body, tabFields(PropertyVideoTour));
    if (data.walklyTourUrl) requirePremium(property, 'Walkly tour');
    return data;
  },

  async attachments(body, { property, ctx, existing }) {
    const data = pick(body, tabFields(PropertyAttachments));

    const existingFiles = [
      ...(existing.brochures || []),
      ...SINGLE_DOCUMENT_FIELDS.map((field) => existing[field]),
    ];

    data.brochures = mapFiles(data.brochures, existingFiles, ctx.actorId, FILE_INPUT_FIELDS, 'brochures');
    SINGLE_DOCUMENT_FIELDS.forEach((field) => {
      if (data[field] === undefined || data[field] === null) {
        data[field] = undefined;
        return;
      }
      data[field] = withUploadMeta(data[field], existingFiles, ctx.actorId, FILE_INPUT_FIELDS, field);
    });

    if (property.development) {
      const devDetails = await DevelopmentDetails.findOne({ development: property.development })
        .select('applyBrochuresToProperties applySitePlanToProperties')
        .lean();
      if (devDetails?.applyBrochuresToProperties && data.brochures?.length) {
        throw new ApiError(400, 'Brochures are set by the development and cannot be changed here');
      }
      if (devDetails?.applySitePlanToProperties && data.sitePlan) {
        throw new ApiError(400, 'The site plan is set by the development and cannot be changed here');
      }
    }

    return data;
  },

  async extras(body, { property }) {
    requirePremium(property, 'The Extras section');
    return pick(body, tabFields(PropertyExtras));
  },

  async enquiryContacts(body) {
    return pick(body, tabFields(PropertyEnquiryContacts));
  },
};

module.exports = {
  SECTION_BY_SLUG,
  TAB_MODELS,
  LOCATION_FIELDS,
  ORGANISATION_LOCATION_FIELDS,
  MONEY_CRITERIA,
  PRICING_FIELDS,
  FILE_INPUT_FIELDS,
  IMAGE_INPUT_FIELDS,
  tabFields,
  applyFields,
  requirePremium,
  withUploadMeta,
  mapFiles,
  normaliseNameAndPlace,
  normalisers,
};
