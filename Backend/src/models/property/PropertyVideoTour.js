const mongoose = require('mongoose');
const { VIDEO_PROVIDERS } = require('../../common/propertyOptions');
const { httpsUrl, tabBaseFields } = require('../shared');

const propertyVideoTourSchema = new mongoose.Schema(
  {
    ...tabBaseFields('property', 'Property'),

    videoProvider: { type: String, enum: VIDEO_PROVIDERS, default: 'none' },
    videoUrl: httpsUrl(),

    virtualTourSupplier: { type: String, trim: true },
    /** Only the src URL from the supplier's embed code; raw iframe HTML is never stored */
    virtualTourUrl: httpsUrl(),

    /** Premium listings only (enforced in the service) */
    walklyTourUrl: httpsUrl(),
  },
  { timestamps: true }
);

propertyVideoTourSchema.pre('validate', function validateVideo(next) {
  if (this.videoProvider !== 'none' && !this.videoUrl) {
    this.invalidate('videoUrl', `videoUrl is required when videoProvider is ${this.videoProvider}`);
  }
  next();
});

module.exports = mongoose.model('PropertyVideoTour', propertyVideoTourSchema);
