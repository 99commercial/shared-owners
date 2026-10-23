const asyncHandler = require('../../../utils/asyncHandler');
const { getClientInfo } = require('../../../utils/requestInfo');
const adminUserService = require('../services/adminUser.service');

const listUsers = asyncHandler(async (req, res) => {
  const data = await adminUserService.listUsers(req.query);
  res.status(200).json({ success: true, data });
});

const getUser = asyncHandler(async (req, res) => {
  const data = await adminUserService.getUser(req.params.userId);
  res.status(200).json({ success: true, data });
});

const deleteUser = asyncHandler(async (req, res) => {
  const data = await adminUserService.deleteUser(req.user, req.params.userId);
  res.status(200).json({ success: true, message: 'User deleted', data });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await adminUserService.updateUser(req.params.userId, req.body);
  res.status(200).json({ success: true, message: 'User updated', data: { user } });
});

const impersonateUser = asyncHandler(async (req, res) => {
  const data = await adminUserService.impersonateUser(req.user, req.params.userId, getClientInfo(req));
  res.status(200).json({ success: true, data });
});

const listSessions = asyncHandler(async (req, res) => {
  const data = await adminUserService.listSessions(req.params.userId, req.query);
  res.status(200).json({ success: true, data });
});

const listSessionActivities = asyncHandler(async (req, res) => {
  const data = await adminUserService.listSessionActivities(
    req.params.userId,
    req.params.sessionId,
    req.query
  );
  res.status(200).json({ success: true, data });
});

module.exports = {
  listUsers,
  getUser,
  deleteUser,
  updateUser,
  impersonateUser,
  listSessions,
  listSessionActivities,
};
