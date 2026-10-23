const mongoose = require('mongoose');
const { PETS_ALLOWED, ACCESSIBILITY_STANDARDS } = require('../../common/propertyOptions');
const { tabBaseFields } = require('../shared');

const wholeNumber = (max) => ({
  type: Number,
  min: 0,
  max,
  validate: { validator: Number.isInteger, message: '{PATH} must be a whole number' },
});

const propertyDescriptionSchema = new mongoose.Schema(
  {
    ...tabBaseFields('property', 'Property'),

    summary: { type: String, trim: true, maxlength: 200 },
    /** Rich text (HTML), sanitised before saving */
    description: { type: String, trim: true, maxlength: 20000 },
    /** Rich text (HTML list), sanitised before saving */
    keyFeatures: { type: String, trim: true, maxlength: 5000 },
    /** 0 = studio */
    bedrooms: wholeNumber(20),
    bathrooms: wholeNumber(20),
    petsAllowed: { type: String, enum: PETS_ALLOWED },
    accessibility: { type: String, enum: ACCESSIBILITY_STANDARDS },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PropertyDescription', propertyDescriptionSchema);
