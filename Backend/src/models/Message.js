const mongoose = require('mongoose');

const { ObjectId } = mongoose.Schema.Types;

const messageSchema = new mongoose.Schema(
  {
    conversation: { type: ObjectId, ref: 'Conversation', required: true },
    sender: { type: ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, maxlength: 2000 },
    /** Set when the other side opens the thread. Unread messages can trigger one email. */
    readAt: { type: Date, default: null },
    emailSentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

messageSchema.index({ conversation: 1, createdAt: -1, _id: -1 });
messageSchema.index({ readAt: 1, emailSentAt: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
