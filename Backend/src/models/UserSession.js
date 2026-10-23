const mongoose = require('mongoose');
const { ROLE_VALUES } = require('../common/roles');
const { SESSION_END_REASON_VALUES } = require('../common/sessionOptions');

const { loginDeviceSchema } = require('./shared');

const { ObjectId } = mongoose.Schema.Types;

/**
 * One document per login (device). The access token carries the session id,
 * so ending a session (logout / delete) blocks its tokens immediately.
 * Only a SHA-256 hash of the current refresh token is stored; it is rotated
 * on every refresh.
 */
const userSessionSchema = new mongoose.Schema(
  {
    user: { type: ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ROLE_VALUES, required: true },
    organisationId: { type: ObjectId, ref: 'User', default: null },

    /** Set when an organisation, organisation admin or platform admin logged in as this account */
    impersonatedBy: { type: ObjectId, ref: 'User', default: null },

    ip: { type: String, trim: true },
    userAgent: { type: String, trim: true },
    device: { type: loginDeviceSchema, default: undefined },

    refreshTokenHash: { type: String, required: true, select: false },
    refreshTokenExpiresAt: { type: Date, required: true },

    lastActivityAt: { type: Date, default: Date.now },
    endedAt: { type: Date, default: null },
    endReason: { type: String, enum: SESSION_END_REASON_VALUES },
  },
  { timestamps: true }
);

userSessionSchema.index({ refreshTokenHash: 1 }, { unique: true });
userSessionSchema.index({ user: 1, createdAt: -1 });
userSessionSchema.index({ user: 1, endedAt: 1 });
userSessionSchema.index({ ip: 1 });

module.exports = mongoose.model('UserSession', userSessionSchema);
