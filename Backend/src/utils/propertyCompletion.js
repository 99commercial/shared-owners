const {
  PROPERTY_SECTIONS,
  REQUIRED_PROPERTY_SECTIONS,
} = require('../common/propertyOptions');

const SHARED_OWNERSHIP_FIELDS = Object.freeze([
  'minimumSharePercentage',
  'pricing.fullMarketValue',
  'pricing.monthlyRentAtMinShare',
]);

const DISCOUNTED_SALE_FIELDS = Object.freeze([
  'pricing.fullMarketValue',
  'pricing.discountPercentage',
]);

/** Pricing fields required by each scheme type (skipped while availability is coming_soon) */
const DETAILS_FIELDS_BY_SCHEME = Object.freeze({
  shared_ownership: SHARED_OWNERSHIP_FIELDS,
  shared_ownership_resale: SHARED_OWNERSHIP_FIELDS,
  older_persons_shared_ownership: SHARED_OWNERSHIP_FIELDS,
  home_ownership_long_term_disabilities: SHARED_OWNERSHIP_FIELDS,
  rent_to_buy: ['pricing.fullMarketValue', 'pricing.monthlyRent'],
  discounted_market_sale: DISCOUNTED_SALE_FIELDS,
  first_homes: DISCOUNTED_SALE_FIELDS,
});

const getPath = (obj, path) => path.split('.').reduce((value, key) => value?.[key], obj);

const isBlank = (value) =>
  value === undefined || value === null || (typeof value === 'string' && !value.trim());

const missingFrom = (obj, paths) => paths.filter((path) => isBlank(getPath(obj, path)));

/** Each returns the list of missing fields for a saved section */
const SECTION_RULES = {
  location: (property) => [
    ...missingFrom(property, [
      'name',
      'address.postcode',
      'address.line1',
      'address.townCity',
      'address.localAuthority',
    ]),
    ...(property.location?.coordinates?.length === 2 ? [] : ['location']),
  ],

  details: (details) => {
    const missing = missingFrom(details, ['schemeType', 'availability', 'propertyType', 'tenure']);
    if (details.schemeType && details.availability !== 'coming_soon') {
      missing.push(...missingFrom(details, DETAILS_FIELDS_BY_SCHEME[details.schemeType] || []));
    }
    return missing;
  },

  description: (description) =>
    missingFrom(description, ['summary', 'description', 'bedrooms', 'bathrooms']),

  gallery: (gallery) => (gallery.images?.length ? [] : ['images']),

  attachments: (attachments) => (attachments.energyCertificate?.url ? [] : ['energyCertificate']),
};

/**
 * `tabs` maps section key -> tab document (plain object) or null when not saved yet.
 * Required sections are complete when all their required fields are filled;
 * optional sections count as complete once saved.
 */
const computeCompletion = (property, tabs) => {
  const sections = {};

  PROPERTY_SECTIONS.forEach((key) => {
    const required = REQUIRED_PROPERTY_SECTIONS.includes(key);
    const doc = key === 'location' ? property : tabs[key];
    const saved = Boolean(doc);
    const rule = SECTION_RULES[key];
    const missingFields = saved ? (rule ? rule(doc) : []) : rule ? ['section not saved'] : [];

    sections[key] = {
      required,
      saved,
      complete: saved && missingFields.length === 0,
      missingFields,
    };
  });

  const completedSections = PROPERTY_SECTIONS.filter((key) => sections[key].complete);
  const missingSections = REQUIRED_PROPERTY_SECTIONS.filter((key) => !sections[key].complete);

  return {
    isComplete: missingSections.length === 0,
    completedSections,
    missingSections,
    sections,
  };
};

module.exports = { computeCompletion };
