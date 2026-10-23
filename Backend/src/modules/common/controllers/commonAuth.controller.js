const asyncHandler = require('../../../utils/asyncHandler');
const { getClientInfo } = require('../../../utils/requestInfo');
const commonAuthService = require('../services/commonAuth.service');

/** POST /api/common/register */
const register = asyncHandler(async (req, res) => {
  const data = await commonAuthService.register(req.body, getClientInfo(req));
  res.status(201).json({ success: true, data });
});

/** POST /api/common/login */
const login = asyncHandler(async (req, res) => {
  const data = await commonAuthService.login(req.body, getClientInfo(req));
  res.status(200).json({ success: true, data });
});

/** GET /api/common/verify-email/:token?userId=... */
const verifyEmail = asyncHandler(async (req, res) => {
  const data = await commonAuthService.verifyEmail(req.params.token, req.query.userId);
  res.status(200).json({ success: true, data });
});

/** POST /api/common/resend-verification */
const resendVerification = asyncHandler(async (req, res) => {
  const data = await commonAuthService.resendVerification(req.body);
  res.status(200).json({ success: true, data });
});

/** POST /api/common/forgot-password */
const forgotPassword = asyncHandler(async (req, res) => {
  const data = await commonAuthService.forgotPassword(req.body);
  res.status(200).json({ success: true, data });
});

/** POST /api/common/reset-password */
const resetPassword = asyncHandler(async (req, res) => {
  const data = await commonAuthService.resetPassword(req.body);
  res.status(200).json({ success: true, data });
});

module.exports = {
  register,
  login,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
};
