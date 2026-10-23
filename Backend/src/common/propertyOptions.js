const PROPERTY_STATUS = Object.freeze({
  DRAFT: 'draft',
  PENDING_APPROVAL: 'pending_approval',
  LIVE: 'live',
  ARCHIVED: 'archived',
  SUSPENDED: 'suspended',
});

const PROPERTY_STATUS_VALUES = Object.freeze(Object.values(PROPERTY_STATUS));

const OWNER_TYPES = Object.freeze(['user', 'organisation']);

/** Admin approval queue a pending listing sits in: never been live = create, otherwise edit */
const APPROVAL_REQUEST_TYPES = Object.freeze({
  CREATE: 'create',
  EDIT: 'edit',
});

const APPROVAL_DECISIONS = Object.freeze(['approved', 'rejected']);

/**
 * Listing tabs. Every required section must be complete before a listing
 * can go live or be submitted for approval.
 */
const PROPERTY_SECTIONS = Object.freeze([
  'location',
  'details',
  'description',
  'eligibility',
  'gallery',
  'videoTour',
  'attachments',
  'extras',
  'enquiryContacts',
]);

const REQUIRED_PROPERTY_SECTIONS = Object.freeze([
  'location',
  'details',
  'description',
  'gallery',
  'attachments',
]);

// Details tab
const SCHEME_TYPES = Object.freeze([
  'shared_ownership',
  'shared_ownership_resale',
  'older_persons_shared_ownership',
  'home_ownership_long_term_disabilities',
  'rent_to_buy',
  'discounted_market_sale',
  'first_homes',
]);

const AVAILABILITY = Object.freeze(['coming_soon', 'available', 'under_offer', 'sold']);

const PROPERTY_TYPES = Object.freeze([
  'flat',
  'studio',
  'maisonette',
  'terraced_house',
  'end_of_terrace_house',
  'semi_detached_house',
  'detached_house',
  'bungalow',
  'townhouse',
]);

const TENURES = Object.freeze(['leasehold', 'freehold', 'share_of_freehold', 'commonhold']);

const COUNCIL_TAX_BANDS = Object.freeze(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']);

const PARKING = Object.freeze([
  'none',
  'on_street',
  'permit',
  'allocated',
  'garage',
  'driveway',
  'underground',
]);

const OUTSIDE_SPACE = Object.freeze([
  'balcony',
  'terrace',
  'roof_terrace',
  'private_garden',
  'communal_garden',
]);

const ACCESSIBLE_MEASURES = Object.freeze([
  'step_free_access',
  'lift_access',
  'wheelchair_accessible',
  'level_access_shower',
  'wide_doorways',
  'ground_floor_bedroom',
]);

const FURNISHING = Object.freeze(['unfurnished', 'part_furnished', 'furnished']);

const APPLIANCE_OPTIONS = Object.freeze(['included', 'integrated', 'not_included']);

const UNIT_SIZE_SCALES = Object.freeze(['sq_ft', 'sq_m']);

const ROOM_DIMENSION_UNITS = Object.freeze(['m', 'ft']);

const LISTED_STATUS = Object.freeze([
  'not_listed',
  'grade_i',
  'grade_ii_star',
  'grade_ii',
  'category_a',
  'category_b',
  'category_c',
]);

const SEWERAGE_SUPPLY = Object.freeze(['mains', 'septic_tank', 'cesspit', 'treatment_plant', 'other']);

const WATER_SUPPLY = Object.freeze(['mains', 'private', 'other']);

const ELECTRICITY_SUPPLY = Object.freeze(['mains', 'mains_with_solar', 'off_grid', 'other']);

const BROADBAND = Object.freeze(['none', 'adsl', 'fttc', 'fttp', 'cable', 'satellite', 'mobile', 'other']);

// Description tab
const PETS_ALLOWED = Object.freeze(['yes', 'no', 'on_request']);

/** Building Regulations Part M categories */
const ACCESSIBILITY_STANDARDS = Object.freeze([
  'm4_1_visitable',
  'm4_2_accessible_adaptable',
  'm4_3_wheelchair_user',
]);

// Eligibility tab
const ELIGIBILITY_CRITERIA = Object.freeze([
  'max_household_income',
  'min_household_income',
  'min_deposit',
  'first_time_buyer',
  'no_other_property',
  'min_age',
  'local_connection',
  'live_or_work_in_area',
  'key_worker',
  'armed_forces',
  'existing_social_tenant',
]);

// Videos & Virtual Tours tab
const VIDEO_PROVIDERS = Object.freeze(['none', 'youtube', 'vimeo']);

// File uploads
const IMAGE_MIME_TYPES = Object.freeze(['image/jpeg', 'image/png']);
const DOCUMENT_MIME_TYPES = Object.freeze(['application/pdf', 'image/jpeg', 'image/png']);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

module.exports = {
  PROPERTY_STATUS,
  PROPERTY_STATUS_VALUES,
  OWNER_TYPES,
  APPROVAL_REQUEST_TYPES,
  APPROVAL_DECISIONS,
  PROPERTY_SECTIONS,
  REQUIRED_PROPERTY_SECTIONS,
  SCHEME_TYPES,
  AVAILABILITY,
  PROPERTY_TYPES,
  TENURES,
  COUNCIL_TAX_BANDS,
  PARKING,
  OUTSIDE_SPACE,
  ACCESSIBLE_MEASURES,
  FURNISHING,
  APPLIANCE_OPTIONS,
  UNIT_SIZE_SCALES,
  ROOM_DIMENSION_UNITS,
  LISTED_STATUS,
  SEWERAGE_SUPPLY,
  WATER_SUPPLY,
  ELECTRICITY_SUPPLY,
  BROADBAND,
  PETS_ALLOWED,
  ACCESSIBILITY_STANDARDS,
  ELIGIBILITY_CRITERIA,
  VIDEO_PROVIDERS,
  IMAGE_MIME_TYPES,
  DOCUMENT_MIME_TYPES,
  MAX_IMAGE_BYTES,
};
