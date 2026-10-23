const DEVELOPMENT_STATUS = Object.freeze({
  DRAFT: 'draft',
  PENDING_APPROVAL: 'pending_approval',
  LIVE: 'live',
  ARCHIVED: 'archived',
  SUSPENDED: 'suspended',
});

const DEVELOPMENT_STATUS_VALUES = Object.freeze(Object.values(DEVELOPMENT_STATUS));

/** Optional, used for SEO only */
const DEVELOPMENT_TYPES = Object.freeze([
  'apartments',
  'houses',
  'mixed_homes',
  'retirement_living',
  'regeneration',
  'conversion',
]);

module.exports = {
  DEVELOPMENT_STATUS,
  DEVELOPMENT_STATUS_VALUES,
  DEVELOPMENT_TYPES,
};
