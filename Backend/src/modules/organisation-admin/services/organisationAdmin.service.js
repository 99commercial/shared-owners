const User = require('../../../models/User');
const { ROLES } = require('../../../common/roles');
const sessionService = require('../../../utils/session.service');
const profileService = require('../../../utils/profile.service');
const organisationDashboardService = require('../../../utils/organisationDashboard.service');
const authService = require('../../../utils/auth.service');

const { frontendUrl: FRONTEND_URL } = require('../../../config');

const ADMIN_ROLES = Object.freeze([ROLES.ORGANISATION_ADMIN]);

const WRONG_ROLE_MESSAGE =
  'This login is for organisation admins. Organisation accounts, organisation users and individual users have their own login';

const ORGANISATION_SUMMARY_FIELDS =
  'email organisationProfile.name organisationProfile.slug organisationProfile.type organisationProfile.logoUrl';

const login = async (payload = {}, client) => {
  sessionService.assertCompanyEmail(payload.email);

  const user = await sessionService.verifyCredentials(payload, ADMIN_ROLES, WRONG_ROLE_MESSAGE);
  await sessionService.assertOrganisationActive(user);

  const tokens = await sessionService.startSession(user, client);
  return { user, ...tokens };
};

const refreshTokens = (refreshToken) => sessionService.refreshSession(refreshToken, ADMIN_ROLES);

const logout = (sessionId) => sessionService.endSession(sessionId);

// Org-admins are created by organisations, so email verification is not required on their end.
// Forgot-password and OTP-based password change are supported.

const forgotPassword = ({ email } = {}) =>
  authService.sendPasswordResetEmail(email, [ROLES.ORGANISATION_ADMIN], FRONTEND_URL);

const resetPassword = ({ userId, token, newPassword } = {}) =>
  authService.resetPassword(userId, token, newPassword);

const sendPasswordChangeOtp = (userId) => authService.sendPasswordChangeOtp(userId);

const changePasswordWithOtp = (userId, sessionId, body) =>
  authService.changePasswordWithOtp(userId, sessionId, body);

/** The admin's own profile, plus a short summary of the organisation they belong to */
const getProfile = async (adminId) => {
  const admin = await profileService.getProfile(adminId);
  const organisation = await User.findById(admin.organisationId)
    .select(ORGANISATION_SUMMARY_FIELDS)
    .lean();
  return { admin, organisation };
};

module.exports = {
  login,
  refreshTokens,
  logout,
  getProfile,
  updateProfile: profileService.updateProfile,
  getDashboard: organisationDashboardService.getDashboard,
  forgotPassword,
  resetPassword,
  sendPasswordChangeOtp,
  changePasswordWithOtp,
};
