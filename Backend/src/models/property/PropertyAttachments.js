const mongoose = require('mongoose');
const { DOCUMENT_MIME_TYPES } = require('../../common/propertyOptions');
const { fileFields, httpsUrl, tabBaseFields } = require('../shared');

const MAX_BROCHURES = 2;

const documentSchema = new mongoose.Schema(fileFields(DOCUMENT_MIME_TYPES));

const propertyAttachmentsSchema = new mongoose.Schema(
  {
    ...tabBaseFields('property', 'Property'),

    brochures: {
      type: [documentSchema],
      default: [],
      validate: {
        validator: (list) => list.length <= MAX_BROCHURES,
        message: `A maximum of ${MAX_BROCHURES} brochures is allowed`,
      },
    },
    priceList: documentSchema,
    floorPlan: documentSchema,
    energyCertificate: documentSchema,
    sitePlan: documentSchema,
    keyInformationDocument: documentSchema,
    keyInformationUrl: httpsUrl(),
  },
  { timestamps: true }
);

module.exports = mongoose.model('PropertyAttachments', propertyAttachmentsSchema);
