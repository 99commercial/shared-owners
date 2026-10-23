const asyncHandler = require('../../../utils/asyncHandler');
const { getClientInfo } = require('../../../utils/requestInfo');
const userService = require('../services/user.service');

const register = asyncHandler(async (req, res) => {
  const data = await userService.register(req.body, getClientInfo(req));
  res.status(201).json({ success: true, data });
});

const login = asyncHandler(async (req, res) => {
  const data = await userService.login(req.body, getClientInfo(req));
  res.status(200).json({ success: true, data });
});

const refreshToken = asyncHandler(async (req, res) => {
  const data = await userService.refreshTokens(req.body?.refreshToken);
  res.status(200).json({ success: true, data });
});

const logout = asyncHandler(async (req, res) => {
  await userService.logout(req.user.sessionId);
  res.status(200).json({ success: true, message: 'Logged out' });
});

const getProfile = asyncHandler(async (req, res) => {
  const user = await userService.getProfile(req.user.id);
  res.status(200).json({ success: true, data: { user } });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user.id, req.body);
  res.status(200).json({ success: true, data: { user } });
});

const uploadProfilePhoto = asyncHandler(async (req, res) => {
  const user = await userService.uploadProfilePhoto(req.user.id, req.file.buffer);
  res.status(200).json({ success: true, data: { user } });
});

const removeProfilePhoto = asyncHandler(async (req, res) => {
  const user = await userService.removeProfilePhoto(req.user.id);
  res.status(200).json({ success: true, data: { user } });
});

const getDashboard = asyncHandler(async (req, res) => {
  const data = await userService.getDashboard(req.user.id);
  res.status(200).json({ success: true, data });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const data = await userService.verifyEmail(req.params.token, req.query.userId);
  res.status(200).json({ success: true, data });
});

const resendVerification = asyncHandler(async (req, res) => {
  const data = await userService.resendVerification(req.body);
  res.status(200).json({ success: true, data });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const data = await userService.forgotPassword(req.body);
  res.status(200).json({ success: true, data });
});

const resetPassword = asyncHandler(async (req, res) => {
  const data = await userService.resetPassword(req.body);
  res.status(200).json({ success: true, data });
});

const sendPasswordChangeOtp = asyncHandler(async (req, res) => {
  const data = await userService.sendPasswordChangeOtp(req.user.id);
  res.status(200).json({ success: true, data });
});

const changePasswordWithOtp = asyncHandler(async (req, res) => {
  const data = await userService.changePasswordWithOtp(req.user.id, req.user.sessionId, req.body);
  res.status(200).json({ success: true, data });
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
  uploadProfilePhoto,
  removeProfilePhoto,
  getDashboard,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  sendPasswordChangeOtp,
  changePasswordWithOtp,
};
