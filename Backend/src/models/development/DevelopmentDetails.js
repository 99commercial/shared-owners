const mongoose = require('mongoose');
const { VIDEO_PROVIDERS, DOCUMENT_MIME_TYPES } = require('../../common/propertyOptions');
const {
  EMAIL_REGEX,
  PHONE_REGEX,
  fileFields,
  httpsUrl,
  tabBaseFields,
} = require('../shared');

const MAX_BROCHURES = 2;

const documentSchema = new mongoose.Schema(fileFields(DOCUMENT_MIME_TYPES));

const developmentDetailsSchema = new mongoose.Schema(
  {
    ...tabBaseFields('development', 'Development'),

    /** Rich text (HTML), sanitised before saving */
    description: { type: String, trim: true, maxlength: 20000 },

    // Virtual tour
    virtualTourSupplier: { type: String, trim: true },
    /** Only the src URL from the supplier's embed code; raw iframe HTML is never stored */
    virtualTourUrl: httpsUrl(),
    /** Properties without their own tour show this one */
    applyVirtualTourToProperties: { type: Boolean, default: false },

    // Sales contacts (blank = housing provider default)
    salesTelephone: {
      type: String,
      trim: true,
      match: [PHONE_REGEX, 'Invalid telephone number'],
    },
    salesEmail: {
      type: String,
      trim: true,
      lowercase: true,
      match: [EMAIL_REGEX, 'Invalid email'],
    },

    // Video
    videoProvider: { type: String, enum: VIDEO_PROVIDERS, default: 'none' },
    videoUrl: httpsUrl(),

    // Attachments
    brochures: {
      type: [documentSchema],
      default: [],
      validate: {
        validator: (list) => list.length <= MAX_BROCHURES,
        message: `A maximum of ${MAX_BROCHURES} brochures is allowed`,
      },
    },
    sitePlan: documentSchema,
    priceList: documentSchema,
    /** Development brochures show on every property; property-level brochures are locked */
    applyBrochuresToProperties: { type: Boolean, default: false },
    /** Development site plan shows on every property; property-level site plans are disabled */
    applySitePlanToProperties: { type: Boolean, default: false },
  },
  { timestamps: true }
);

developmentDetailsSchema.pre('validate', function validateVideo(next) {
  if (this.videoProvider !== 'none' && !this.videoUrl) {
    this.invalidate('videoUrl', `videoUrl is required when videoProvider is ${this.videoProvider}`);
  }
  next();
});

module.exports = mongoose.model('DevelopmentDetails', developmentDetailsSchema);
