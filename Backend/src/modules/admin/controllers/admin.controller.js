const asyncHandler = require('../../../utils/asyncHandler');
const { getClientInfo } = require('../../../utils/requestInfo');
const adminService = require('../services/admin.service');

const login = asyncHandler(async (req, res) => {
  const data = await adminService.login(req.body, getClientInfo(req));
  res.status(200).json({ success: true, data });
});

const refreshToken = asyncHandler(async (req, res) => {
  const data = await adminService.refreshTokens(req.body?.refreshToken);
  res.status(200).json({ success: true, data });
});

const logout = asyncHandler(async (req, res) => {
  await adminService.logout(req.user.sessionId);
  res.status(200).json({ success: true, message: 'Logged out' });
});

const getProfile = asyncHandler(async (req, res) => {
  const admin = await adminService.getProfile(req.user.id);
  res.status(200).json({ success: true, data: { admin } });
});

const updateProfile = asyncHandler(async (req, res) => {
  const admin = await adminService.updateProfile(req.user.id, req.body);
  res.status(200).json({ success: true, data: { admin } });
});

const uploadProfilePhoto = asyncHandler(async (req, res) => {
  const admin = await adminService.uploadProfilePhoto(req.user.id, req.file.buffer);
  res.status(200).json({ success: true, data: { admin } });
});

const removeProfilePhoto = asyncHandler(async (req, res) => {
  const admin = await adminService.removeProfilePhoto(req.user.id);
  res.status(200).json({ success: true, data: { admin } });
});

const changePassword = asyncHandler(async (req, res) => {
  await adminService.changePassword(req.user, req.body);
  res.status(200).json({ success: true, message: 'Password changed. Other devices have been signed out' });
});

const getDashboard = asyncHandler(async (req, res) => {
  const data = await adminService.getDashboard();
  res.status(200).json({ success: true, data });
});

module.exports = {
  login,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
  uploadProfilePhoto,
  removeProfilePhoto,
  changePassword,
  getDashboard,
};
