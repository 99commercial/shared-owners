const mongoose = require('mongoose');
const { ROLE_VALUES } = require('../common/roles');
const { ACTIVITY_LOG_RETENTION_DAYS } = require('../common/sessionOptions');

const { ObjectId } = mongoose.Schema.Types;

/** One document per authenticated API call. Request bodies are never stored. */
const activityLogSchema = new mongoose.Schema(
  {
    user: { type: ObjectId, ref: 'User', required: true },
    session: { type: ObjectId, ref: 'UserSession', required: true },
    role: { type: String, enum: ROLE_VALUES },
    organisationId: { type: ObjectId, ref: 'User', default: null },
    impersonatedBy: { type: ObjectId, ref: 'User', default: null },

    method: { type: String, required: true },
    path: { type: String, required: true },
    /** Route pattern, e.g. /api/users/properties/:id */
    route: { type: String },
    query: { type: mongoose.Schema.Types.Mixed },
    statusCode: { type: Number },
    durationMs: { type: Number },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

activityLogSchema.index({ session: 1, createdAt: 1 });
activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ organisationId: 1, createdAt: -1 });
activityLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: ACTIVITY_LOG_RETENTION_DAYS * 24 * 60 * 60 }
);

module.exports = mongoose.model('ActivityLog', activityLogSchema);
