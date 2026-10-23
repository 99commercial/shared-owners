const mongoose = require('mongoose');
const {
  DEVELOPMENT_STATUS,
  DEVELOPMENT_STATUS_VALUES,
  DEVELOPMENT_TYPES,
} = require('../../common/developmentOptions');
const { addressSchema, pointSchema, moderationSchema } = require('../shared');

const { ObjectId } = mongoose.Schema.Types;

const developmentSchema = new mongoose.Schema(
  {
    // Development tab (basic details)
    name: { type: String, trim: true, required: true, maxlength: 150 },
    developmentType: { type: String, enum: DEVELOPMENT_TYPES },
    address: { type: addressSchema, default: () => ({}) },
    location: pointSchema,

    // Ownership: always an organisation (the housing provider)
    owner: { type: ObjectId, ref: 'User', required: true },
    createdBy: { type: ObjectId, ref: 'User', required: true },
    updatedBy: { type: ObjectId, ref: 'User' },
    assignedTo: { type: ObjectId, ref: 'User', default: null },

    // Publishing (shown on the Details tab). Affects the development only, not its properties.
    status: {
      type: String,
      enum: DEVELOPMENT_STATUS_VALUES,
      default: DEVELOPMENT_STATUS.DRAFT,
    },
    publishedAt: { type: Date },
    syndication: {
      homesForLondoners: { type: Boolean, default: false },
    },
    isPremium: { type: Boolean, default: false },
    moderation: moderationSchema,

    // One document per tab (null until that tab is first saved)
    details: { type: ObjectId, ref: 'DevelopmentDetails', default: null },
    images: { type: ObjectId, ref: 'DevelopmentImages', default: null },
    extras: { type: ObjectId, ref: 'DevelopmentExtras', default: null },

    /** Kept in sync by the development service when the Images tab is saved */
    searchSnapshot: {
      primaryImageUrl: { type: String, trim: true },
    },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

developmentSchema.index({ owner: 1, status: 1, createdAt: -1 });
developmentSchema.index({ owner: 1, assignedTo: 1, status: 1 });
developmentSchema.index({ owner: 1, name: 1 });
developmentSchema.index({ status: 1, 'address.postcode': 1 });
developmentSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Development', developmentSchema);
