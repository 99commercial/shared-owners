const {
  DevelopmentDetails,
  DevelopmentImages,
  DevelopmentExtras,
} = require('../models/development');
const { sanitizeRichText } = require('./richText');
const { isNonEmptyString, pick } = require('./validators');
const {
  FILE_INPUT_FIELDS,
  IMAGE_INPUT_FIELDS,
  tabFields,
  requirePremium,
  withUploadMeta,
  mapFiles,
  normaliseNameAndPlace,
} = require('./propertySections');

/**
 * URL slug -> section key. `development` is the main schema, `publishing` sets
 * the status / syndication fields on the main schema, the rest are tab collections
 * (the key is also the ref field name on Development).
 */
const SECTION_BY_SLUG = Object.freeze({
  development: 'development',
  details: 'details',
  images: 'images',
  extras: 'extras',
  publishing: 'publishing',
});

const TAB_MODELS = Object.freeze({
  details: DevelopmentDetails,
  images: DevelopmentImages,
  extras: DevelopmentExtras,
});

const DEVELOPMENT_FIELDS = Object.freeze(['name', 'developmentType', 'address', 'location']);

const ADDRESS_FIELDS_TO_PUBLISH = Object.freeze(['postcode', 'line1', 'townCity', 'localAuthority']);
const BANNER_INPUT_FIELDS = Object.freeze([...FILE_INPUT_FIELDS, 'widthPx', 'heightPx', 'order']);
const SINGLE_DOCUMENT_FIELDS = Object.freeze(['sitePlan', 'priceList']);

/** Fields that must be filled before a development can be published or submitted */
const missingToPublish = (development) => {
  const address = development.address || {};
  const missing = ADDRESS_FIELDS_TO_PUBLISH.filter((field) => !isNonEmptyString(address[field])).map(
    (field) => `address.${field}`
  );
  if (development.location?.coordinates?.length !== 2) missing.push('location');
  return missing;
};

/**
 * Turns a request body into the values to store for one section.
 * Saving a section replaces it as a whole, so anything not returned is cleared.
 */
const normalisers = {
  async development(body) {
    const data = normaliseNameAndPlace(pick(body, DEVELOPMENT_FIELDS));
    if (data.developmentType === '' || data.developmentType === null) data.developmentType = undefined;
    return data;
  },

  async details(body, { ctx, existing }) {
    const data = pick(body, tabFields(DevelopmentDetails));
    if (data.description !== undefined) data.description = sanitizeRichText(data.description);

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

    return data;
  },

  async images(body, { ctx, existing }) {
    const data = pick(body, tabFields(DevelopmentImages));
    data.bannerImages = mapFiles(
      data.bannerImages,
      existing.bannerImages || [],
      ctx.actorId,
      BANNER_INPUT_FIELDS,
      'bannerImages'
    );
    data.images = mapFiles(data.images, existing.images || [], ctx.actorId, IMAGE_INPUT_FIELDS, 'images');
    return data;
  },

  async extras(body, { development }) {
    requirePremium(development, 'The Extras section');
    return pick(body, tabFields(DevelopmentExtras));
  },
};

module.exports = {
  SECTION_BY_SLUG,
  TAB_MODELS,
  DEVELOPMENT_FIELDS,
  missingToPublish,
  normalisers,
};
