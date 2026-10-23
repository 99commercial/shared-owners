const asyncHandler = require('../../../utils/asyncHandler');
const { getClientInfo } = require('../../../utils/requestInfo');
const organisationAdminService = require('../services/organisationAdmin.service');

const login = asyncHandler(async (req, res) => {
  const data = await organisationAdminService.login(req.body, getClientInfo(req));
  res.status(200).json({ success: true, data });
});

const refreshToken = asyncHandler(async (req, res) => {
  const data = await organisationAdminService.refreshTokens(req.body?.refreshToken);
  res.status(200).json({ success: true, data });
});

const logout = asyncHandler(async (req, res) => {
  await organisationAdminService.logout(req.user.sessionId);
  res.status(200).json({ success: true, message: 'Logged out' });
});

const getProfile = asyncHandler(async (req, res) => {
  const data = await organisationAdminService.getProfile(req.user.id);
  res.status(200).json({ success: true, data });
});

const updateProfile = asyncHandler(async (req, res) => {
  const admin = await organisationAdminService.updateProfile(req.user.id, req.body);
  res.status(200).json({ success: true, data: { admin } });
});

const getDashboard = asyncHandler(async (req, res) => {
  const data = await organisationAdminService.getDashboard(req.user.organisationId);
  res.status(200).json({ success: true, data });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const data = await organisationAdminService.forgotPassword(req.body);
  res.status(200).json({ success: true, data });
});

const resetPassword = asyncHandler(async (req, res) => {
  const data = await organisationAdminService.resetPassword(req.body);
  res.status(200).json({ success: true, data });
});

const sendPasswordChangeOtp = asyncHandler(async (req, res) => {
  const data = await organisationAdminService.sendPasswordChangeOtp(req.user.id);
  res.status(200).json({ success: true, data });
});

const changePasswordWithOtp = asyncHandler(async (req, res) => {
  const data = await organisationAdminService.changePasswordWithOtp(req.user.id, req.user.sessionId, req.body);
  res.status(200).json({ success: true, data });
});

module.exports = {
  login,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
  getDashboard,
  forgotPassword,
  resetPassword,
  sendPasswordChangeOtp,
  changePasswordWithOtp,
};
