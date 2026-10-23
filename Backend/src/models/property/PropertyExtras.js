const mongoose = require('mongoose');
const { EMAIL_REGEX, tabBaseFields } = require('../shared');

/** Whole tab is for premium listings only (enforced in the service) */
const propertyExtrasSchema = new mongoose.Schema(
  {
    ...tabBaseFields('property', 'Property'),

    /** Must be one of the organisation's responder emails; copied on every enquiry */
    responderEmail: {
      type: String,
      trim: true,
      lowercase: true,
      match: [EMAIL_REGEX, 'Invalid responder email'],
    },
    announcement: { type: String, trim: true, maxlength: 150 },
    /** Announcement is hidden from the listing after this date */
    announcementEndDate: { type: Date },
  },
  { timestamps: true }
);

propertyExtrasSchema.pre('validate', function validateAnnouncement(next) {
  if (this.announcementEndDate && !this.announcement) {
    this.invalidate('announcementEndDate', 'announcementEndDate needs an announcement');
  }
  next();
});

module.exports = mongoose.model('PropertyExtras', propertyExtrasSchema);
