const mongoose = require('mongoose');
const {
  SCHEME_TYPES,
  AVAILABILITY,
  PROPERTY_TYPES,
  TENURES,
  COUNCIL_TAX_BANDS,
  PARKING,
  OUTSIDE_SPACE,
  ACCESSIBLE_MEASURES,
  FURNISHING,
  APPLIANCE_OPTIONS,
  UNIT_SIZE_SCALES,
  ROOM_DIMENSION_UNITS,
  LISTED_STATUS,
  SEWERAGE_SUPPLY,
  WATER_SUPPLY,
  ELECTRICITY_SUPPLY,
  BROADBAND,
} = require('../../common/propertyOptions');
const { pence, tabBaseFields } = require('../shared');

/** Which fields apply depends on schemeType; the service validates per scheme */
const pricingSchema = new mongoose.Schema(
  {
    fullMarketValue: pence(),
    monthlyRentAtMinShare: pence(),
    serviceChargeMonthly: pence(),
    groundRentAnnual: pence(),
    monthlyRent: pence(),
    discountPercentage: { type: Number, min: 0, max: 100 },
  },
  { _id: false }
);

const roomSchema = new mongoose.Schema({
  name: { type: String, trim: true, required: true },
  length: { type: Number, min: 0 },
  width: { type: Number, min: 0 },
  unit: { type: String, enum: ROOM_DIMENSION_UNITS, default: 'm' },
  description: { type: String, trim: true },
});

const unitSizeSchema = new mongoose.Schema(
  {
    value: { type: Number, min: 0, required: true, set: (v) => Math.round(v) },
    scale: { type: String, enum: UNIT_SIZE_SCALES, required: true },
  },
  { _id: false }
);

const faqSchema = new mongoose.Schema({
  question: { type: String, trim: true, required: true },
  answer: { type: String, trim: true, required: true },
});

const propertyDetailsSchema = new mongoose.Schema(
  {
    ...tabBaseFields('property', 'Property'),

    schemeType: { type: String, enum: SCHEME_TYPES },
    availability: { type: String, enum: AVAILABILITY },
    propertyType: { type: String, enum: PROPERTY_TYPES },
    minimumSharePercentage: { type: Number, min: 1, max: 100 },
    tenure: { type: String, enum: TENURES },
    leaseYearsRemaining: { type: Number, min: 0 },
    councilTaxBand: { type: String, enum: COUNCIL_TAX_BANDS },
    /** -1 = basement, 0 = ground */
    floor: { type: Number, min: -2 },
    pricing: { type: pricingSchema, default: () => ({}) },

    // Material information
    materials: { type: String, trim: true },
    parking: { type: String, enum: PARKING },
    outsideSpace: { type: [String], enum: OUTSIDE_SPACE, default: [] },
    accessibleMeasures: { type: [String], enum: ACCESSIBLE_MEASURES, default: [] },
    totalRooms: { type: Number, min: 0 },
    rooms: { type: [roomSchema], default: [] },
    furnished: { type: String, enum: FURNISHING },
    washingMachine: { type: String, enum: APPLIANCE_OPTIONS },
    dishwasher: { type: String, enum: APPLIANCE_OPTIONS },
    fridgeFreezer: { type: String, enum: APPLIANCE_OPTIONS },
    yearBuilt: {
      type: Number,
      validate: {
        validator: (y) => Number.isInteger(y) && y >= 1000 && y <= new Date().getFullYear() + 5,
        message: 'yearBuilt must be a valid year',
      },
    },
    unitSize: unitSizeSchema,
    communalLift: { type: Boolean },
    floodedInLast5Years: { type: Boolean },
    listedStatus: { type: String, enum: LISTED_STATUS },
    heatingDetails: { type: String, trim: true },
    sewerageSupply: { type: String, enum: SEWERAGE_SUPPLY },
    waterSupply: { type: String, enum: WATER_SUPPLY },
    electricitySupply: { type: String, enum: ELECTRICITY_SUPPLY },
    broadband: { type: String, enum: BROADBAND },

    /** Premium listings only (enforced in the service) */
    faqs: { type: [faqSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PropertyDetails', propertyDetailsSchema);
