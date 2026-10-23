const asyncHandler = require('../../../utils/asyncHandler');
const { getClientInfo } = require('../../../utils/requestInfo');
const organisationUserService = require('../services/organisationUser.service');

const register = asyncHandler(async (req, res) => {
  const data = await organisationUserService.register(req.body);
  res.status(201).json({ success: true, data });
});

const login = asyncHandler(async (req, res) => {
  const data = await organisationUserService.login(req.body, getClientInfo(req));
  res.status(200).json({ success: true, data });
});

const refreshToken = asyncHandler(async (req, res) => {
  const data = await organisationUserService.refreshTokens(req.body?.refreshToken);
  res.status(200).json({ success: true, data });
});

const logout = asyncHandler(async (req, res) => {
  await organisationUserService.logout(req.user.sessionId);
  res.status(200).json({ success: true, message: 'Logged out' });
});

const getProfile = asyncHandler(async (req, res) => {
  const data = await organisationUserService.getProfile(req.user.id);
  res.status(200).json({ success: true, data });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await organisationUserService.updateProfile(req.user.id, req.body);
  res.status(200).json({ success: true, data: { user } });
});

const changePassword = asyncHandler(async (req, res) => {
  await organisationUserService.changePassword(req.user, req.body);
  res.status(200).json({ success: true, message: 'Password changed. Other devices have been signed out' });
});

const getDashboard = asyncHandler(async (req, res) => {
  const data = await organisationUserService.getDashboard(req.user);
  res.status(200).json({ success: true, data });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const data = await organisationUserService.verifyEmail(req.params.token, req.query.userId);
  res.status(200).json({ success: true, data });
});

const resendVerification = asyncHandler(async (req, res) => {
  const data = await organisationUserService.resendVerification(req.body);
  res.status(200).json({ success: true, data });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const data = await organisationUserService.forgotPassword(req.body);
  res.status(200).json({ success: true, data });
});

const resetPassword = asyncHandler(async (req, res) => {
  const data = await organisationUserService.resetPassword(req.body);
  res.status(200).json({ success: true, data });
});

const sendPasswordChangeOtp = asyncHandler(async (req, res) => {
  const data = await organisationUserService.sendPasswordChangeOtp(req.user.id);
  res.status(200).json({ success: true, data });
});

const changePasswordWithOtp = asyncHandler(async (req, res) => {
  const data = await organisationUserService.changePasswordWithOtp(req.user.id, req.user.sessionId, req.body);
  res.status(200).json({ success: true, data });
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  getDashboard,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  sendPasswordChangeOtp,
  changePasswordWithOtp,
};
