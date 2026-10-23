const User = require('../../../models/User');
const ApiError = require('../../../utils/ApiError');
const { ROLES } = require('../../../common/roles');
const {
  MIN_PASSWORD_LENGTH,
  isValidEmail,
  isValidPassword,
  isPlainObject,
  isNonEmptyString,
  normaliseEmail,
  isCompanyEmail,
} = require('../../../utils/validators');
const sessionService = require('../../../utils/session.service');
const profileService = require('../../../utils/profile.service');
const authService = require('../../../utils/auth.service');

const { frontendUrl: FRONTEND_URL } = require('../../../config');

/** Roles that may self-register via the public endpoint */
const SELF_REGISTER_ROLES = [ROLES.USER, ROLES.ORGANISATION];

/** Every role signs in from the one login form; admins are still seeded, never registered */
const PUBLIC_LOGIN_ROLES = [
  ROLES.ADMIN,
  ROLES.USER,
  ROLES.ORGANISATION,
  ROLES.ORGANISATION_ADMIN,
  ROLES.ORGANISATION_USER,
];

// ── Slug helper (reused from organisation service) ────────────────────────

const slugify = (value) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const generateUniqueOrgSlug = async (name) => {
  const base = slugify(name) || 'organisation';
  let slug = base;
  let suffix = 1;
  while (await User.exists({ 'organisationProfile.slug': slug })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
};

// ── Register ─────────────────────────────────────────────────────────────

const VERIFY_TO_LOGIN_MESSAGE =
  'Account created. Check your inbox and verify your email address to log in';

/**
 * Unified register. No session is started: the account can log in only after
 * the email address is verified.
 * Body: { type: 'user' | 'organisation', email, password, profile: { ... } }
 */
const register = async (payload = {}) => {
  const { type, email, password, profile } = payload;

  if (!['user', 'organisation'].includes(type)) {
    throw new ApiError(
      400,
      "type must be 'user' or 'organisation'. Organisation admins and users are created by their organisation."
    );
  }

  if (!isValidEmail(email)) throw new ApiError(400, 'A valid email is required');
  if (!isValidPassword(password)) {
    throw new ApiError(400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  if (!isPlainObject(profile)) throw new ApiError(400, 'profile object is required');

  const normalisedEmail = normaliseEmail(email);
  if (await User.exists({ email: normalisedEmail })) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  if (type === 'organisation') {
    // Organisations must use a company email
    if (!isCompanyEmail(email)) {
      throw new ApiError(
        400,
        'Please use your company email address. Personal email providers are not allowed'
      );
    }
    if (!isNonEmptyString(profile.name)) throw new ApiError(400, 'profile.name is required');

    const profileData = profileService.pickProfileFields(ROLES.ORGANISATION, profile);
    profileData.slug = await generateUniqueOrgSlug(profileData.name);

    const organisation = await User.create({
      email: normalisedEmail,
      passwordHash: await sessionService.hashPassword(password),
      role: ROLES.ORGANISATION,
      organisationProfile: profileData,
    });

    await authService.sendVerificationEmail(organisation, FRONTEND_URL);
    return { user: organisation, role: ROLES.ORGANISATION, message: VERIFY_TO_LOGIN_MESSAGE };
  }

  // type === 'user'
  const user = await User.create({
    email: normalisedEmail,
    passwordHash: await sessionService.hashPassword(password),
    role: ROLES.USER,
    userProfile: profileService.pickProfileFields(ROLES.USER, profile),
  });

  await authService.sendVerificationEmail(user, FRONTEND_URL);
  return { user, role: ROLES.USER, message: VERIFY_TO_LOGIN_MESSAGE };
};

// ── Login ─────────────────────────────────────────────────────────────────

/**
 * Unified login — verifies credentials for any role and starts a session.
 * Returns the same shape as the role-specific login endpoints plus `role`.
 */
const login = async (payload = {}, client) => {
  const { email, password } = payload;

  if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
    throw new ApiError(400, 'Email and password are required');
  }

  // Re-use session service's credential check (it also handles isActive)
  const user = await sessionService.verifyCredentials(
    { email, password },
    PUBLIC_LOGIN_ROLES,
    'Invalid email or password'
  );

  // Org members cannot log in if their parent organisation is deactivated
  if (user.organisationId) {
    await sessionService.assertOrganisationActive(user);
  }
  sessionService.assertVerified(user);

  const tokens = await sessionService.startSession(user, client);
  return { user, role: user.role, ...tokens };
};

// ── Email verification ─────────────────────────────────────────────────────

/** Verify email from the link (role-agnostic) */
const verifyEmail = (token, userId) => authService.verifyEmail(userId, token);

/**
 * Re-send verification email.
 * Works for user and organisation roles only: org-admins are created verified and
 * org-users are verified by their organisation's approval, not by email.
 */
const resendVerification = async ({ email } = {}) => {
  if (!isValidEmail(email)) throw new ApiError(400, 'A valid email is required');
  const user = await User.findOne({
    email: normaliseEmail(email),
    role: { $in: authService.EMAIL_VERIFICATION_ROLES },
    isVerified: false,
  });
  if (user) await authService.sendVerificationEmail(user, FRONTEND_URL);
  return {
    message: 'If that email is registered and unverified, a new verification email has been sent',
  };
};

// ── Forgot / reset password ────────────────────────────────────────────────

/**
 * Forgot password — finds the account by email, sends a reset link.
 * Works for all non-admin roles.
 */
const forgotPassword = ({ email } = {}) =>
  authService.sendPasswordResetEmail(
    email,
    [ROLES.USER, ROLES.ORGANISATION, ROLES.ORGANISATION_ADMIN, ROLES.ORGANISATION_USER],
    FRONTEND_URL
  );

const resetPassword = ({ userId, token, newPassword } = {}) =>
  authService.resetPassword(userId, token, newPassword);

module.exports = {
  register,
  login,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
};
