// Mirrors Backend/src/common/propertyOptions.js — keep both in sync.

export const PROPERTY_STATUS_VALUES = ['draft', 'pending_approval', 'live', 'archived', 'suspended'];

export const STATUS_STYLES = {
  draft: 'bg-gray-100 text-gray-700',
  pending_approval: 'bg-amber-100 text-amber-700',
  live: 'bg-green-100 text-green-700',
  archived: 'bg-slate-200 text-slate-700',
  suspended: 'bg-red-100 text-red-700',
};

/** Editor tabs in display order. `slug` is the URL segment for PUT /sections/:slug */
export const PROPERTY_SECTIONS = [
  { key: 'location', slug: 'location', label: 'General Details', description: 'Name, address & map pin', required: true },
  { key: 'details', slug: 'details', label: 'Property Details', description: 'Scheme, pricing & features', required: true },
  { key: 'description', slug: 'description', label: 'Description', description: 'Summary & key features', required: true },
  { key: 'eligibility', slug: 'eligibility', label: 'Eligibility', description: 'Buyer criteria', required: false },
  { key: 'gallery', slug: 'gallery', label: 'Images', description: 'Property photos', required: true },
  { key: 'videoTour', slug: 'video-tour', label: 'Virtual Tours', description: 'Tour links & videos', required: false },
  { key: 'attachments', slug: 'attachments', label: 'Documents', description: 'EPC & certificates', required: true },
  { key: 'extras', slug: 'extras', label: 'Extras', description: 'Premium options', required: false, premium: true },
  { key: 'enquiryContacts', slug: 'enquiry-contacts', label: 'Enquiry Contacts', description: 'Sales contact details', required: false },
];

export const SECTION_LABELS = Object.fromEntries(PROPERTY_SECTIONS.map((s) => [s.key, s.label]));

export const SCHEME_TYPES = [
  'shared_ownership',
  'shared_ownership_resale',
  'older_persons_shared_ownership',
  'home_ownership_long_term_disabilities',
  'rent_to_buy',
  'discounted_market_sale',
  'first_homes',
];

const SHARED_OWNERSHIP_PRICING = ['minimumSharePercentage', 'fullMarketValue', 'monthlyRentAtMinShare'];
const DISCOUNTED_PRICING = ['fullMarketValue', 'discountPercentage'];

/** Pricing fields the backend requires per scheme (unless availability is coming_soon) */
export const REQUIRED_PRICING_BY_SCHEME = {
  shared_ownership: SHARED_OWNERSHIP_PRICING,
  shared_ownership_resale: SHARED_OWNERSHIP_PRICING,
  older_persons_shared_ownership: SHARED_OWNERSHIP_PRICING,
  home_ownership_long_term_disabilities: SHARED_OWNERSHIP_PRICING,
  rent_to_buy: ['fullMarketValue', 'monthlyRent'],
  discounted_market_sale: DISCOUNTED_PRICING,
  first_homes: DISCOUNTED_PRICING,
};

export const AVAILABILITY = ['coming_soon', 'available', 'under_offer', 'sold'];
export const PROPERTY_TYPES = [
  'flat', 'studio', 'maisonette', 'terraced_house', 'end_of_terrace_house',
  'semi_detached_house', 'detached_house', 'bungalow', 'townhouse',
];
export const TENURES = ['leasehold', 'freehold', 'share_of_freehold', 'commonhold'];
export const COUNCIL_TAX_BANDS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
export const PARKING = ['none', 'on_street', 'permit', 'allocated', 'garage', 'driveway', 'underground'];
export const OUTSIDE_SPACE = ['balcony', 'terrace', 'roof_terrace', 'private_garden', 'communal_garden'];
export const ACCESSIBLE_MEASURES = [
  'step_free_access', 'lift_access', 'wheelchair_accessible',
  'level_access_shower', 'wide_doorways', 'ground_floor_bedroom',
];
export const FURNISHING = ['unfurnished', 'part_furnished', 'furnished'];
export const APPLIANCE_OPTIONS = ['included', 'integrated', 'not_included'];
export const UNIT_SIZE_SCALES = [
  { value: 'sq_ft', label: 'sq ft' },
  { value: 'sq_m', label: 'sq m' },
];
export const ROOM_DIMENSION_UNITS = ['m', 'ft'];
export const LISTED_STATUS = [
  'not_listed', 'grade_i', 'grade_ii_star', 'grade_ii', 'category_a', 'category_b', 'category_c',
];
export const SEWERAGE_SUPPLY = ['mains', 'septic_tank', 'cesspit', 'treatment_plant', 'other'];
export const WATER_SUPPLY = ['mains', 'private', 'other'];
export const ELECTRICITY_SUPPLY = ['mains', 'mains_with_solar', 'off_grid', 'other'];
export const BROADBAND = [
  { value: 'none', label: 'None' },
  { value: 'adsl', label: 'ADSL' },
  { value: 'fttc', label: 'FTTC (fibre to cabinet)' },
  { value: 'fttp', label: 'FTTP (full fibre)' },
  { value: 'cable', label: 'Cable' },
  { value: 'satellite', label: 'Satellite' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'other', label: 'Other' },
];

export const PETS_ALLOWED = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'on_request', label: 'On request' },
];
export const ACCESSIBILITY_STANDARDS = [
  { value: 'm4_1_visitable', label: 'M4(1) Visitable' },
  { value: 'm4_2_accessible_adaptable', label: 'M4(2) Accessible & adaptable' },
  { value: 'm4_3_wheelchair_user', label: 'M4(3) Wheelchair user' },
];

/** `kind` decides the value input: money (pounds), age (whole number), text, or boolean */
export const ELIGIBILITY_CRITERIA = [
  { type: 'max_household_income', label: 'Maximum household income', kind: 'money' },
  { type: 'min_household_income', label: 'Minimum household income', kind: 'money' },
  { type: 'min_deposit', label: 'Minimum deposit', kind: 'money' },
  { type: 'first_time_buyer', label: 'First-time buyer', kind: 'boolean' },
  { type: 'no_other_property', label: 'Must not own another property', kind: 'boolean' },
  { type: 'min_age', label: 'Minimum age', kind: 'age' },
  { type: 'local_connection', label: 'Local connection', kind: 'text' },
  { type: 'live_or_work_in_area', label: 'Live or work in area', kind: 'text' },
  { type: 'key_worker', label: 'Key worker', kind: 'boolean' },
  { type: 'armed_forces', label: 'Armed forces', kind: 'boolean' },
  { type: 'existing_social_tenant', label: 'Existing social tenant', kind: 'boolean' },
];

export const VIDEO_PROVIDERS = [
  { value: 'none', label: 'No video' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'vimeo', label: 'Vimeo' },
];

export const SINGLE_DOCUMENTS = [
  { key: 'energyCertificate', label: 'Energy Performance Certificate (EPC)', required: true },
  { key: 'floorPlan', label: 'Floor plan' },
  { key: 'priceList', label: 'Price list' },
  { key: 'sitePlan', label: 'Site plan' },
  { key: 'keyInformationDocument', label: 'Key information document' },
];

export const MAX_GALLERY_IMAGES = 50;
export const MAX_BROCHURES = 2;

export const labelize = (value) =>
  typeof value === 'string'
    ? value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : value;

export const formatMoney = (pounds) =>
  pounds === undefined || pounds === null
    ? '—'
    : new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(pounds);
