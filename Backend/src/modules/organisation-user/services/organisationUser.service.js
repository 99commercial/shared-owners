const User = require('../../../models/User');
const ApiError = require('../../../utils/ApiError');
const { ROLES } = require('../../../common/roles');
const {
  MIN_PASSWORD_LENGTH,
  isNonEmptyString,
  isValidPassword,
  isPlainObject,
  normaliseEmail,
  getEmailDomain,
  escapeRegex,
  isValidEmail,
} = require('../../../utils/validators');
const sessionService = require('../../../utils/session.service');
const profileService = require('../../../utils/profile.service');
const organisationUserPropertyService = require('./organisationUserProperty.service');
const organisationUserDevelopmentService = require('./organisationUserDevelopment.service');
const authService = require('../../../utils/auth.service');

const { frontendUrl: FRONTEND_URL } = require('../../../config');

const USER_ROLES = Object.freeze([ROLES.ORGANISATION_USER]);

const WRONG_ROLE_MESSAGE =
  'This login is for organisation users. Organisation accounts, organisation admins and individual users have their own login';

const ORGANISATION_SUMMARY_FIELDS =
  'email organisationProfile.name organisationProfile.slug organisationProfile.type organisationProfile.logoUrl';

const MANAGER_SUMMARY_FIELDS =
  'email organisationAdminProfile.firstName organisationAdminProfile.lastName organisationAdminProfile.jobTitle';

/**
 * The organisation is the one whose account email shares the user's company
 * domain. `organisationSlug` picks one when several organisations share a domain.
 */
const findOrganisationToJoin = async (email, organisationSlug) => {
  const domain = getEmailDomain(email);
  const fields = 'email isActive organisationProfile.name organisationProfile.slug';

  let organisation;
  if (organisationSlug !== undefined) {
    if (!isNonEmptyString(organisationSlug)) {
      throw new ApiError(400, 'organisationSlug must be text');
    }
    organisation = await User.findOne({
      role: ROLES.ORGANISATION,
      'organisationProfile.slug': organisationSlug.trim().toLowerCase(),
    })
      .select(fields)
      .lean();
    if (!organisation || getEmailDomain(organisation.email) !== domain) {
      throw new ApiError(404, `No organisation with that slug uses @${domain} email addresses`);
    }
  } else {
    const matches = await User.find({
      role: ROLES.ORGANISATION,
      email: new RegExp(`@${escapeRegex(domain)}$`, 'i'),
    })
      .select(fields)
      .lean();

    if (!matches.length) {
      throw new ApiError(404, `No organisation is registered for @${domain}`);
    }
    if (matches.length > 1) {
      throw new ApiError(
        400,
        `Several organisations use @${domain}. Send organisationSlug to choose one`,
        matches.map((org) => ({ name: org.organisationProfile?.name, slug: org.organisationProfile?.slug }))
      );
    }
    [organisation] = matches;
  }

  if (!organisation.isActive) {
    throw new ApiError(403, 'This organisation account is deactivated');
  }
  return organisation;
};

/**
 * Self sign-up with a company email. The account stays pending (isVerified false)
 * and cannot log in until the organisation or one of its admins approves it.
 */
const register = async (payload = {}) => {
  const { email, password, profile, organisationSlug } = payload;

  sessionService.assertCompanyEmail(email);
  if (!isValidPassword(password)) {
    throw new ApiError(400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  if (!isPlainObject(profile)) {
    throw new ApiError(400, 'profile object is required');
  }

  const normalisedEmail = normaliseEmail(email);
  if (await User.exists({ email: normalisedEmail })) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const organisation = await findOrganisationToJoin(normalisedEmail, organisationSlug);

  const user = await User.create({
    email: normalisedEmail,
    passwordHash: await sessionService.hashPassword(password),
    role: ROLES.ORGANISATION_USER,
    organisationId: organisation._id,
    isVerified: false,
    organisationUserProfile: profileService.pickProfileFields(ROLES.ORGANISATION_USER, profile),
  });

  return {
    user,
    organisation: { name: organisation.organisationProfile?.name, slug: organisation.organisationProfile?.slug },
    message: 'Registration received. You can log in once your organisation approves your account',
  };
};

const login = async (payload = {}, client) => {
  sessionService.assertCompanyEmail(payload.email);

  const user = await sessionService.verifyCredentials(payload, USER_ROLES, WRONG_ROLE_MESSAGE);
  await sessionService.assertOrganisationActive(user);
  if (!user.isVerified) {
    throw new ApiError(403, 'Your account is waiting for approval from your organisation');
  }

  const tokens = await sessionService.startSession(user, client);
  return { user, ...tokens };
};

const refreshTokens = (refreshToken) => sessionService.refreshSession(refreshToken, USER_ROLES);

const logout = (sessionId) => sessionService.endSession(sessionId);

/** The user's own profile, their organisation, and the admin who manages them */
const getProfile = async (userId) => {
  const user = await profileService.getProfile(userId);
  const managerId = user.organisationUserProfile?.assignedBy;

  const [organisation, manager] = await Promise.all([
    User.findById(user.organisationId).select(ORGANISATION_SUMMARY_FIELDS).lean(),
    managerId ? User.findById(managerId).select(MANAGER_SUMMARY_FIELDS).lean() : null,
  ]);
  return { user, organisation, manager };
};

/** Numbers for the listings and developments this user created or is assigned to */
const getDashboard = async (user) => {
  const [properties, developments] = await Promise.all([
    organisationUserPropertyService.getPropertyAnalytics(user),
    organisationUserDevelopmentService.getDevelopmentCounts(user),
  ]);
  return { properties, developments };
};

const verifyEmail = (token, userId) => authService.verifyEmail(userId, token);

const resendVerification = async ({ email } = {}) => {
  if (!isValidEmail(email)) throw new ApiError(400, 'A valid email is required');
  const user = await User.findOne({ email: normaliseEmail(email), role: ROLES.ORGANISATION_USER, isVerified: false });
  if (user) await authService.sendVerificationEmail(user, FRONTEND_URL);
  return { message: 'If that email is registered and unverified, a new verification email has been sent' };
};

const forgotPassword = ({ email } = {}) =>
  authService.sendPasswordResetEmail(email, [ROLES.ORGANISATION_USER], FRONTEND_URL);

const resetPassword = ({ userId, token, newPassword } = {}) =>
  authService.resetPassword(userId, token, newPassword);

const sendPasswordChangeOtp = (userId) => authService.sendPasswordChangeOtp(userId);

const changePasswordWithOtp = (userId, sessionId, body) =>
  authService.changePasswordWithOtp(userId, sessionId, body);

module.exports = {
  register,
  login,
  refreshTokens,
  logout,
  getProfile,
  updateProfile: profileService.updateProfile,
  changePassword: sessionService.changePassword,
  getDashboard,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  sendPasswordChangeOtp,
  changePasswordWithOtp,
};
