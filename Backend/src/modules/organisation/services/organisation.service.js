const User = require('../../../models/User');
const { Property } = require('../../../models/property');
const { Development } = require('../../../models/development');
const ApiError = require('../../../utils/ApiError');
const { ROLES } = require('../../../common/roles');
const {
  MIN_PASSWORD_LENGTH,
  isNonEmptyString,
  isValidPassword,
  isPlainObject,
  normaliseEmail,
} = require('../../../utils/validators');
const sessionService = require('../../../utils/session.service');
const profileService = require('../../../utils/profile.service');
const organisationDashboardService = require('../../../utils/organisationDashboard.service');
const authService = require('../../../utils/auth.service');

const { frontendUrl: FRONTEND_URL } = require('../../../config');

/**
 * Organisation admins use /api/organisation-admins/login and organisation
 * users use /api/organisation-users/login.
 */
const ORG_LOGIN_ROLES = Object.freeze([ROLES.ORGANISATION]);

const WRONG_ROLE_MESSAGE =
  'This login is for organisation accounts. Organisation admins, organisation users and individual users have their own login';

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const generateUniqueOrgSlug = async (name) => {
  const base = slugify(name) || 'organisation';
  let slug = base;
  let suffix = 1;

  // eslint-disable-next-line no-await-in-loop
  while (await User.exists({ 'organisationProfile.slug': slug })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
};

const register = async (payload = {}) => {
  const { email, password, profile } = payload;

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

  const profileData = profileService.pickProfileFields(ROLES.ORGANISATION, profile);
  if (!isNonEmptyString(profileData.name)) {
    throw new ApiError(400, 'profile.name is required');
  }
  profileData.slug = await generateUniqueOrgSlug(profileData.name);

  const organisation = await User.create({
    email: normalisedEmail,
    passwordHash: await sessionService.hashPassword(password),
    role: ROLES.ORGANISATION,
    organisationProfile: profileData,
  });

  // No session until the email is verified; mail errors are logged but do not fail registration
  await authService.sendVerificationEmail(organisation, FRONTEND_URL);
  return {
    user: organisation,
    message: 'Organisation registered. Check your inbox and verify your email address to log in',
  };
};

const login = async (payload = {}, client) => {
  sessionService.assertCompanyEmail(payload.email);

  const user = await sessionService.verifyCredentials(payload, ORG_LOGIN_ROLES, WRONG_ROLE_MESSAGE);
  await sessionService.assertOrganisationActive(user);
  sessionService.assertVerified(user);

  const tokens = await sessionService.startSession(user, client);
  return { user, ...tokens };
};

const refreshTokens = (refreshToken) => sessionService.refreshSession(refreshToken, ORG_LOGIN_ROLES);

const logout = (sessionId) => sessionService.endSession(sessionId);

const verifyEmail = (token, userId) => authService.verifyEmail(userId, token);

const resendVerification = async ({ email } = {}) => {
  const { isValidEmail } = require('../../../utils/validators');
  if (!isValidEmail(email)) throw new ApiError(400, 'A valid email is required');
  const user = await User.findOne({ email: normaliseEmail(email), role: ROLES.ORGANISATION, isVerified: false });
  if (user) await authService.sendVerificationEmail(user, FRONTEND_URL);
  return { message: 'If that email is registered and unverified, a new verification email has been sent' };
};

const forgotPassword = ({ email } = {}) =>
  authService.sendPasswordResetEmail(email, [ROLES.ORGANISATION], FRONTEND_URL);

const resetPassword = ({ userId, token, newPassword } = {}) =>
  authService.resetPassword(userId, token, newPassword);

const sendPasswordChangeOtp = (userId) => authService.sendPasswordChangeOtp(userId);

const changePasswordWithOtp = (userId, sessionId, body) =>
  authService.changePasswordWithOtp(userId, sessionId, body);

const getProfile = async (organisationId) => {
  const [organisation, members, properties, developments] = await Promise.all([
    profileService.getProfile(organisationId),
    organisationDashboardService.countMembers(organisationId),
    Property.countDocuments({ owner: organisationId, ownerType: 'organisation', isDeleted: false }),
    Development.countDocuments({ owner: organisationId, isDeleted: false }),
  ]);
  return { organisation, members, propertyCount: properties, developmentCount: developments };
};

module.exports = {
  ORG_LOGIN_ROLES,
  register,
  login,
  refreshTokens,
  logout,
  getProfile,
  updateProfile: profileService.updateProfile,
  uploadLogo: profileService.uploadProfilePhoto,
  removeLogo: profileService.removeProfilePhoto,
  getDashboard: organisationDashboardService.getDashboard,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  sendPasswordChangeOtp,
  changePasswordWithOtp,
};
