const mongoose = require('mongoose');
const {
  ROLES,
  ROLE_VALUES,
  ORG_MEMBER_ROLES,
  PROFILE_KEY_BY_ROLE,
} = require('../common/roles');
const { loginDeviceSchema } = require('./shared');

const addressSchema = new mongoose.Schema(
  {
    line1: { type: String, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, trim: true },
    county: { type: String, trim: true },
    postcode: { type: String, trim: true, uppercase: true },
  },
  { _id: false }
);

/** Regular platform user (buyer / interested party) */
const userProfileSchema = new mongoose.Schema(
  {
    firstName: { type: String, trim: true, required: true },
    lastName: { type: String, trim: true, required: true },
    phone: { type: String, trim: true },
    avatarUrl: { type: String, trim: true },
  },
  { _id: false }
);

/** Organisation account profile (housing assoc / developer / landlord / agent) */
const organisationProfileSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    slug: { type: String, trim: true, lowercase: true, required: true },
    type: {
      type: String,
      enum: ['housing_association', 'developer', 'landlord', 'agent'],
      required: true,
    },
    description: { type: String, trim: true },
    contactEmail: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    website: { type: String, trim: true },
    address: addressSchema,
    logoUrl: { type: String, trim: true },
  },
  { _id: false }
);

/**
 * Organisation admin — manages organisation-users, allocates tasks.
 * Still under the parent organisation account.
 */
const organisationAdminProfileSchema = new mongoose.Schema(
  {
    firstName: { type: String, trim: true, required: true },
    lastName: { type: String, trim: true, required: true },
    phone: { type: String, trim: true },
    jobTitle: { type: String, trim: true },
    avatarUrl: { type: String, trim: true },
  },
  { _id: false }
);

/**
 * Organisation user — handles assigned work under an org-admin.
 */
const organisationUserProfileSchema = new mongoose.Schema(
  {
    firstName: { type: String, trim: true, required: true },
    lastName: { type: String, trim: true, required: true },
    phone: { type: String, trim: true },
    jobTitle: { type: String, trim: true },
    avatarUrl: { type: String, trim: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
);

/** Updated on every own login (not when someone impersonates the account) */
const lastLoginSchema = new mongoose.Schema(
  {
    ip: { type: String, trim: true },
    userAgent: { type: String, trim: true },
    device: loginDeviceSchema,
    at: { type: Date },
  },
  { _id: false }
);

/** Platform admin */
const adminProfileSchema = new mongoose.Schema(
  {
    firstName: { type: String, trim: true, required: true },
    lastName: { type: String, trim: true, required: true },
    phone: { type: String, trim: true },
    avatarUrl: { type: String, trim: true },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ROLE_VALUES,
      required: true,
    },

    /**
     * Links organisation-admin / organisation-user to the User
     * document with role === 'organisation'.
     */
    organisationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    lastLogin: { type: lastLoginSchema, default: undefined },

    // Email verification
    emailVerificationToken: { type: String, select: false },
    emailVerificationTokenExpiry: { type: Date },

    // Password reset (unauthenticated forgot-password flow)
    passwordResetToken: { type: String, select: false },
    passwordResetTokenExpiry: { type: Date },

    // Password change OTP (authenticated change-password flow)
    passwordChangeOtp: { type: String, select: false },
    passwordChangeOtpExpiry: { type: Date },

    // Role-specific profiles (only one should be populated per document)
    userProfile: userProfileSchema,
    organisationProfile: organisationProfileSchema,
    organisationAdminProfile: organisationAdminProfileSchema,
    organisationUserProfile: organisationUserProfileSchema,
    adminProfile: adminProfileSchema,
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

userSchema.index({ role: 1 });
userSchema.index({ organisationId: 1 });
userSchema.index({ 'lastLogin.ip': 1 });
userSchema.index(
  { 'organisationProfile.slug': 1 },
  {
    unique: true,
    partialFilterExpression: {
      role: ROLES.ORGANISATION,
      'organisationProfile.slug': { $type: 'string' },
    },
  }
);

userSchema.pre('validate', function validateRoleProfile(next) {
  const { role } = this;

  if (ORG_MEMBER_ROLES.includes(role) && !this.organisationId) {
    this.invalidate('organisationId', `organisationId is required when role is ${role}`);
  }

  if (role === ROLES.ORGANISATION && this.organisationId) {
    this.invalidate(
      'organisationId',
      'organisation role must not have organisationId (this account is the organisation)'
    );
  }

  const requiredProfile = PROFILE_KEY_BY_ROLE[role];
  if (requiredProfile && !this[requiredProfile]) {
    this.invalidate(requiredProfile, `${requiredProfile} is required when role is ${role}`);
  }

  next();
});

module.exports = mongoose.model('User', userSchema);
