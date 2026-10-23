const mongoose = require('mongoose');
const {
  PROPERTY_STATUS,
  PROPERTY_STATUS_VALUES,
  OWNER_TYPES,
  APPROVAL_REQUEST_TYPES,
  APPROVAL_DECISIONS,
  PROPERTY_SECTIONS,
  SCHEME_TYPES,
  AVAILABILITY,
  PROPERTY_TYPES,
} = require('../../common/propertyOptions');
const {
  pence,
  addressSchema,
  pointSchema,
  moderationSchema,
} = require('../shared');

const { ObjectId } = mongoose.Schema.Types;

/**
 * Copy of the tab fields used by search filters and dashboard cards, so
 * listing pages don't need to join 8 collections. Kept in sync by the
 * property service whenever the Details / Description / Gallery tabs are saved.
 */
const searchSnapshotSchema = new mongoose.Schema(
  {
    schemeType: { type: String, enum: SCHEME_TYPES },
    availability: { type: String, enum: AVAILABILITY },
    propertyType: { type: String, enum: PROPERTY_TYPES },
    bedrooms: { type: Number, min: 0 },
    fullMarketValue: pence(),
    minimumSharePercentage: { type: Number, min: 0, max: 100 },
    primaryImageUrl: { type: String, trim: true },
  },
  { _id: false }
);

/**
 * Admin approval for individual users' listings. Set when a complete listing is
 * submitted; requestType decides whether it shows in the admin's create or edit queue.
 */
const approvalSchema = new mongoose.Schema(
  {
    requestType: { type: String, enum: Object.values(APPROVAL_REQUEST_TYPES) },
    submittedAt: { type: Date },
    submittedBy: { type: ObjectId, ref: 'User' },
    decision: { type: String, enum: APPROVAL_DECISIONS },
    reason: { type: String, trim: true },
    reviewedBy: { type: ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
  },
  { _id: false }
);

/** Recomputed by the property service on every section save */
const completionSchema = new mongoose.Schema(
  {
    isComplete: { type: Boolean, default: false },
    completedSections: { type: [String], enum: PROPERTY_SECTIONS, default: [] },
    missingSections: { type: [String], enum: PROPERTY_SECTIONS, default: [] },
  },
  { _id: false }
);

const propertySchema = new mongoose.Schema(
  {
    // Location tab (basic details)
    name: { type: String, trim: true, required: true, maxlength: 150 },
    reference: { type: String, trim: true, maxlength: 50 },
    development: { type: ObjectId, ref: 'Development', default: null },
    address: { type: addressSchema, default: () => ({}) },
    location: pointSchema,

    // Ownership
    ownerType: { type: String, enum: OWNER_TYPES, required: true },
    owner: { type: ObjectId, ref: 'User', required: true },
    createdBy: { type: ObjectId, ref: 'User', required: true },
    updatedBy: { type: ObjectId, ref: 'User' },
    assignedTo: { type: ObjectId, ref: 'User', default: null },

    // Lifecycle
    status: {
      type: String,
      enum: PROPERTY_STATUS_VALUES,
      default: PROPERTY_STATUS.DRAFT,
    },
    isPremium: { type: Boolean, default: false },
    publishedAt: { type: Date },
    moderation: moderationSchema,
    approval: approvalSchema,
    completion: { type: completionSchema, default: () => ({}) },

    // One document per tab (null until that tab is first saved)
    details: { type: ObjectId, ref: 'PropertyDetails', default: null },
    description: { type: ObjectId, ref: 'PropertyDescription', default: null },
    eligibility: { type: ObjectId, ref: 'PropertyEligibility', default: null },
    gallery: { type: ObjectId, ref: 'PropertyGallery', default: null },
    videoTour: { type: ObjectId, ref: 'PropertyVideoTour', default: null },
    attachments: { type: ObjectId, ref: 'PropertyAttachments', default: null },
    extras: { type: ObjectId, ref: 'PropertyExtras', default: null },
    enquiryContacts: { type: ObjectId, ref: 'PropertyEnquiryContacts', default: null },

    searchSnapshot: { type: searchSnapshotSchema, default: () => ({}) },

    stats: {
      views: { type: Number, default: 0, min: 0 },
      enquiries: { type: Number, default: 0, min: 0 },
    },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

propertySchema.index({ owner: 1, status: 1, createdAt: -1 });
propertySchema.index({ owner: 1, assignedTo: 1, status: 1 });
propertySchema.index({ createdBy: 1, createdAt: -1 });
propertySchema.index({ status: 1, 'approval.requestType': 1, 'approval.submittedAt': 1 });
propertySchema.index({ development: 1 });
propertySchema.index({ status: 1, 'address.postcode': 1 });
propertySchema.index({
  status: 1,
  'searchSnapshot.schemeType': 1,
  'searchSnapshot.availability': 1,
  'searchSnapshot.bedrooms': 1,
  'searchSnapshot.fullMarketValue': 1,
});
propertySchema.index({ location: '2dsphere' });
propertySchema.index(
  { owner: 1, reference: 1 },
  { unique: true, partialFilterExpression: { reference: { $type: 'string' } } }
);

propertySchema.pre('validate', function validateOwnership(next) {
  if (this.ownerType === 'user' && this.assignedTo) {
    this.invalidate('assignedTo', 'assignedTo is only allowed on organisation listings');
  }
  if (this.ownerType === 'user' && this.development) {
    this.invalidate('development', 'Only organisation listings can belong to a development');
  }
  next();
});

module.exports = mongoose.model('Property', propertySchema);
