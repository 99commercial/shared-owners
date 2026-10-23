const User = require('../../../models/User');
const ApiError = require('../../../utils/ApiError');
const { ROLES } = require('../../../common/roles');
const {
  MIN_PASSWORD_LENGTH,
  isValidEmail,
  isValidPassword,
  isPlainObject,
  normaliseEmail,
} = require('../../../utils/validators');
const sessionService = require('../../../utils/session.service');
const profileService = require('../../../utils/profile.service');
const propertyService = require('../../../utils/property.service');
const authService = require('../../../utils/auth.service');

const { frontendUrl: FRONTEND_URL } = require('../../../config');

const WRONG_ROLE_MESSAGE =
  'This login is for individual users. Organisation accounts must use the organisation login';

const register = async (payload = {}) => {
  const { email, password, role, profile } = payload;

  if (role !== undefined && role !== ROLES.USER) {
    throw new ApiError(400, 'Organisations must register at /api/organisations/register');
  }
  if (!isValidEmail(email)) {
    throw new ApiError(400, 'A valid email is required');
  }
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

  const user = await User.create({
    email: normalisedEmail,
    passwordHash: await sessionService.hashPassword(password),
    role: ROLES.USER,
    userProfile: profileService.pickProfileFields(ROLES.USER, profile),
  });

  // No session until the email is verified; mail errors are logged but do not fail registration
  await authService.sendVerificationEmail(user, FRONTEND_URL);
  return { user, message: 'Account created. Check your inbox and verify your email address to log in' };
};

const login = async (payload, client) => {
  const user = await sessionService.verifyCredentials(payload, [ROLES.USER], WRONG_ROLE_MESSAGE);
  sessionService.assertVerified(user);
  const tokens = await sessionService.startSession(user, client);
  return { user, ...tokens };
};

const refreshTokens = (refreshToken) => sessionService.refreshSession(refreshToken, [ROLES.USER]);

const logout = (sessionId) => sessionService.endSession(sessionId);

const verifyEmail = (token, userId) => authService.verifyEmail(userId, token);

const resendVerification = async ({ email } = {}) => {
  if (!isValidEmail(email)) throw new ApiError(400, 'A valid email is required');
  const user = await User.findOne({ email: normaliseEmail(email), role: ROLES.USER, isVerified: false });
  // Always return the same message to prevent email enumeration
  if (user) await authService.sendVerificationEmail(user, FRONTEND_URL);
  return { message: 'If that email is registered and unverified, a new verification email has been sent' };
};

const forgotPassword = ({ email } = {}) =>
  authService.sendPasswordResetEmail(email, [ROLES.USER], FRONTEND_URL);

const resetPassword = ({ userId, token, newPassword } = {}) =>
  authService.resetPassword(userId, token, newPassword);

const sendPasswordChangeOtp = (userId) => authService.sendPasswordChangeOtp(userId);

const changePasswordWithOtp = (userId, sessionId, body) =>
  authService.changePasswordWithOtp(userId, sessionId, body);

const getDashboard = async (userId) => {
  const ctx = { ownerType: 'user', ownerId: userId };
  const [user, properties] = await Promise.all([
    profileService.getProfile(userId),
    propertyService.getPropertyAnalytics(ctx),
  ]);
  return { profile: user, properties };
};

module.exports = {
  register,
  login,
  refreshTokens,
  logout,
  getProfile: profileService.getProfile,
  updateProfile: profileService.updateProfile,
  uploadProfilePhoto: profileService.uploadProfilePhoto,
  removeProfilePhoto: profileService.removeProfilePhoto,
  getDashboard,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  sendPasswordChangeOtp,
  changePasswordWithOtp,
};
