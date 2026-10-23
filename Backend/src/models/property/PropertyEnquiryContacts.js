const mongoose = require('mongoose');
const { EMAIL_REGEX, PHONE_REGEX, tabBaseFields } = require('../shared');

/**
 * Overrides only. When empty, enquiries use the owner's default contact
 * details (organisation profile phone / contactEmail, or the user's own).
 */
const propertyEnquiryContactsSchema = new mongoose.Schema(
  {
    ...tabBaseFields('property', 'Property'),

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
  },
  { timestamps: true }
);

module.exports = mongoose.model('PropertyEnquiryContacts', propertyEnquiryContactsSchema);
