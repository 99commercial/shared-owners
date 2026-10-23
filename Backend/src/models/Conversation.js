const mongoose = require('mongoose');

const { ObjectId } = mongoose.Schema.Types;

/**
 * One thread per property and the person who started it from the listing page.
 * The owner side is the listing owner: a private seller, or the company account
 * (company admins and company users share that side).
 */
const conversationSchema = new mongoose.Schema(
  {
    property: { type: ObjectId, ref: 'Property', required: true },
    propertyName: { type: String, trim: true, required: true },
    propertyReference: { type: String, trim: true },
    propertyImageUrl: { type: String, trim: true },

    enquirer: { type: ObjectId, ref: 'User', required: true },
    owner: { type: ObjectId, ref: 'User', required: true },

    lastMessageText: { type: String, default: '' },
    lastMessageAt: { type: Date, default: Date.now },
    lastMessageBy: { type: ObjectId, ref: 'User', default: null },

    enquirerUnread: { type: Number, default: 0, min: 0 },
    ownerUnread: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

conversationSchema.index({ property: 1, enquirer: 1 }, { unique: true });
conversationSchema.index({ enquirer: 1, lastMessageAt: -1 });
conversationSchema.index({ owner: 1, lastMessageAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
