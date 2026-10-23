// Mirrors Backend/src/common/developmentOptions.js and the development models — keep in sync.

export const DEVELOPMENT_STATUS_VALUES = ['draft', 'pending_approval', 'live', 'archived', 'suspended'];

export const DEVELOPMENT_TYPES = [
  'apartments',
  'houses',
  'mixed_homes',
  'retirement_living',
  'regeneration',
  'conversion',
];

export const MAX_DEVELOPMENT_BROCHURES = 2;
export const MAX_BANNER_IMAGES = 5;
export const MAX_DEVELOPMENT_IMAGES = 50;

/** Editor steps in display order. `slug` is the URL segment for PUT /sections/:slug */
export const DEVELOPMENT_SECTIONS = [
  { key: 'development', slug: 'development', label: 'General Details', description: 'Name, type, address & map', required: true },
  { key: 'details', slug: 'details', label: 'Details', description: 'Description, tours & documents' },
  { key: 'images', slug: 'images', label: 'Images', description: 'Banners & gallery' },
  { key: 'extras', slug: 'extras', label: 'Extras', description: 'Developer page summary', premium: true },
  { key: 'publishing', slug: 'publishing', label: 'Publishing', description: 'Go live & syndication', required: true },
];
