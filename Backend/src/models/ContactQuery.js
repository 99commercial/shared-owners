const mongoose = require('mongoose');
const { CONTACT_QUERY_STATUS, CONTACT_QUERY_STATUS_VALUES } = require('../common/contentOptions');

const { ObjectId } = mongoose.Schema.Types;

/** Messages sent from the public Contact Us form */
const contactQuerySchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true, maxlength: 120 },
    email: { type: String, trim: true, lowercase: true, required: true, maxlength: 200 },
    phone: { type: String, trim: true, maxlength: 30 },
    subject: { type: String, trim: true, required: true, maxlength: 200 },
    message: { type: String, trim: true, required: true, maxlength: 5000 },
    status: { type: String, enum: CONTACT_QUERY_STATUS_VALUES, default: CONTACT_QUERY_STATUS.NEW },
    adminNote: { type: String, trim: true, maxlength: 2000 },
    handledBy: { type: ObjectId, ref: 'User' },
    handledAt: { type: Date },
    ip: { type: String, trim: true },
    userAgent: { type: String, trim: true },
  },
  { timestamps: true }
);

contactQuerySchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('ContactQuery', contactQuerySchema);
