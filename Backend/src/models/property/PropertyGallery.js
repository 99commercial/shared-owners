const mongoose = require('mongoose');
const { galleryImagesField, tabBaseFields } = require('../shared');

const MAX_IMAGES = 50;

const propertyGallerySchema = new mongoose.Schema(
  {
    ...tabBaseFields('property', 'Property'),

    images: galleryImagesField(MAX_IMAGES),
  },
  { timestamps: true }
);

module.exports = mongoose.model('PropertyGallery', propertyGallerySchema);
