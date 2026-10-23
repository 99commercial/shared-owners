const mongoose = require('mongoose');
const { IMAGE_MIME_TYPES, MAX_IMAGE_BYTES } = require('../../common/propertyOptions');
const { fileFields, galleryImagesField, tabBaseFields } = require('../shared');

const MAX_BANNER_IMAGES = 5;
const MAX_IMAGES = 50;

/** Minimum dimensions are checked at upload; stored so the frontend can crop correctly */
const bannerImageSchema = new mongoose.Schema({
  ...fileFields(IMAGE_MIME_TYPES, MAX_IMAGE_BYTES),
  widthPx: { type: Number, min: 0 },
  heightPx: { type: Number, min: 0 },
  order: { type: Number, default: 0 },
});

const developmentImagesSchema = new mongoose.Schema(
  {
    ...tabBaseFields('development', 'Development'),

    bannerImages: {
      type: [bannerImageSchema],
      default: [],
      validate: {
        validator: (list) => list.length <= MAX_BANNER_IMAGES,
        message: `A maximum of ${MAX_BANNER_IMAGES} banner images is allowed`,
      },
    },
    images: galleryImagesField(MAX_IMAGES),
  },
  { timestamps: true }
);

module.exports = mongoose.model('DevelopmentImages', developmentImagesSchema);
