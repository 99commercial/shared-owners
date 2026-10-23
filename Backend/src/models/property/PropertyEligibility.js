const mongoose = require('mongoose');
const { ELIGIBILITY_CRITERIA } = require('../../common/propertyOptions');
const { tabBaseFields } = require('../shared');

/**
 * value type depends on `type`: pence for income/deposit, number for min_age,
 * string for area-based criteria, boolean for the rest. Checked in the service.
 */
const criterionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ELIGIBILITY_CRITERIA, required: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { _id: false }
);

const propertyEligibilitySchema = new mongoose.Schema(
  {
    ...tabBaseFields('property', 'Property'),

    /** Used to mark each enquiry as Priority (meets all) or Non-priority */
    criteria: {
      type: [criterionSchema],
      default: [],
      validate: {
        validator: (list) => new Set(list.map((c) => c.type)).size === list.length,
        message: 'Each eligibility criterion can only be added once',
      },
    },
    /** Rich text shown to buyers; generated from criteria or written by hand */
    criteriaText: { type: String, trim: true, maxlength: 10000 },
    /** true once edited by hand, so "Refresh Eligibility Text" must confirm before overwriting */
    isCustomText: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PropertyEligibility', propertyEligibilitySchema);
