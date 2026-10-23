const mongoose = require('mongoose');
const { IMAGE_MIME_TYPES, MAX_IMAGE_BYTES } = require('../common/propertyOptions');

const { ObjectId } = mongoose.Schema.Types;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HTTPS_URL_REGEX = /^https:\/\/\S+$/i;
const PHONE_REGEX = /^\+?[\d\s()-]{7,20}$/;
const UK_POSTCODE_REGEX = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/;

/** Money is stored as whole pence to avoid floating-point rounding */
const pence = () => ({
  type: Number,
  min: 0,
  validate: {
    validator: Number.isInteger,
    message: '{PATH} must be a whole number of pence',
  },
});

const httpsUrl = () => ({
  type: String,
  trim: true,
  match: [HTTPS_URL_REGEX, '{PATH} must be an https URL'],
});

const fileFields = (allowedMimeTypes, maxBytes) => ({
  url: { type: String, required: true, trim: true },
  storageKey: { type: String, trim: true },
  fileName: { type: String, trim: true },
  mimeType: { type: String, enum: allowedMimeTypes },
  sizeBytes: { type: Number, min: 0, ...(maxBytes && { max: maxBytes }) },
  uploadedBy: { type: ObjectId, ref: 'User' },
  uploadedAt: { type: Date, default: Date.now },
});

/**
 * Every tab document belongs to exactly one parent listing.
 * e.g. tabBaseFields('property', 'Property')
 */
const tabBaseFields = (fieldName, parentModel) => ({
  [fieldName]: { type: ObjectId, ref: parentModel, required: true, unique: true },
  updatedBy: { type: ObjectId, ref: 'User' },
});

const addressSchema = new mongoose.Schema(
  {
    postcode: {
      type: String,
      trim: true,
      uppercase: true,
      match: [UK_POSTCODE_REGEX, 'Invalid UK postcode'],
    },
    line1: { type: String, trim: true },
    line2: { type: String, trim: true },
    townCity: { type: String, trim: true },
    localAuthority: { type: String, trim: true },
  },
  { _id: false }
);

/** GeoJSON point from the map pin: [longitude, latitude] */
const pointSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['Point'], default: 'Point', required: true },
    coordinates: {
      type: [Number],
      validate: {
        validator: (c) =>
          c.length === 2 && c[0] >= -180 && c[0] <= 180 && c[1] >= -90 && c[1] <= 90,
        message: 'coordinates must be [longitude, latitude]',
      },
    },
  },
  { _id: false }
);

const moderationSchema = new mongoose.Schema(
  {
    reason: { type: String, trim: true },
    by: { type: ObjectId, ref: 'User' },
    at: { type: Date },
  },
  { _id: false }
);

/** Parsed from the User-Agent header at login */
const loginDeviceSchema = new mongoose.Schema(
  {
    browser: { type: String, trim: true },
    os: { type: String, trim: true },
    deviceType: { type: String, enum: ['desktop', 'mobile', 'tablet', 'other'] },
  },
  { _id: false }
);

const galleryImageSchema = new mongoose.Schema({
  ...fileFields(IMAGE_MIME_TYPES, MAX_IMAGE_BYTES),
  caption: { type: String, trim: true, maxlength: 200 },
  order: { type: Number, default: 0 },
  isPrimary: { type: Boolean, default: false },
});

const galleryImagesField = (maxImages) => ({
  type: [galleryImageSchema],
  default: [],
  validate: [
    {
      validator: (list) => list.length <= maxImages,
      message: `A maximum of ${maxImages} images is allowed`,
    },
    {
      validator: (list) => list.filter((img) => img.isPrimary).length <= 1,
      message: 'Only one image can be primary',
    },
  ],
});

module.exports = {
  EMAIL_REGEX,
  PHONE_REGEX,
  pence,
  httpsUrl,
  fileFields,
  tabBaseFields,
  addressSchema,
  pointSchema,
  moderationSchema,
  loginDeviceSchema,
  galleryImagesField,
};
