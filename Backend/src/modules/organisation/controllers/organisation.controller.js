const asyncHandler = require('../../../utils/asyncHandler');
const { getClientInfo } = require('../../../utils/requestInfo');
const organisationService = require('../services/organisation.service');

const register = asyncHandler(async (req, res) => {
  const data = await organisationService.register(req.body, getClientInfo(req));
  res.status(201).json({ success: true, data });
});

const login = asyncHandler(async (req, res) => {
  const data = await organisationService.login(req.body, getClientInfo(req));
  res.status(200).json({ success: true, data });
});

const refreshToken = asyncHandler(async (req, res) => {
  const data = await organisationService.refreshTokens(req.body?.refreshToken);
  res.status(200).json({ success: true, data });
});

const logout = asyncHandler(async (req, res) => {
  await organisationService.logout(req.user.sessionId);
  res.status(200).json({ success: true, message: 'Logged out' });
});

const getProfile = asyncHandler(async (req, res) => {
  const data = await organisationService.getProfile(req.user.id);
  res.status(200).json({ success: true, data });
});

const updateProfile = asyncHandler(async (req, res) => {
  const organisation = await organisationService.updateProfile(req.user.id, req.body);
  res.status(200).json({ success: true, data: { organisation } });
});

const uploadLogo = asyncHandler(async (req, res) => {
  const organisation = await organisationService.uploadLogo(req.user.id, req.file.buffer);
  res.status(200).json({ success: true, data: { organisation } });
});

const removeLogo = asyncHandler(async (req, res) => {
  const organisation = await organisationService.removeLogo(req.user.id);
  res.status(200).json({ success: true, data: { organisation } });
});

const getDashboard = asyncHandler(async (req, res) => {
  const data = await organisationService.getDashboard(req.user.id);
  res.status(200).json({ success: true, data });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const data = await organisationService.verifyEmail(req.params.token, req.query.userId);
  res.status(200).json({ success: true, data });
});

const resendVerification = asyncHandler(async (req, res) => {
  const data = await organisationService.resendVerification(req.body);
  res.status(200).json({ success: true, data });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const data = await organisationService.forgotPassword(req.body);
  res.status(200).json({ success: true, data });
});

const resetPassword = asyncHandler(async (req, res) => {
  const data = await organisationService.resetPassword(req.body);
  res.status(200).json({ success: true, data });
});

const sendPasswordChangeOtp = asyncHandler(async (req, res) => {
  const data = await organisationService.sendPasswordChangeOtp(req.user.id);
  res.status(200).json({ success: true, data });
});

const changePasswordWithOtp = asyncHandler(async (req, res) => {
  const data = await organisationService.changePasswordWithOtp(req.user.id, req.user.sessionId, req.body);
  res.status(200).json({ success: true, data });
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
  uploadLogo,
  removeLogo,
  getDashboard,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  sendPasswordChangeOtp,
  changePasswordWithOtp,
};
