const asyncHandler = require('../../../utils/asyncHandler');
const { getClientInfo } = require('../../../utils/requestInfo');
const organisationAdminUserService = require('../services/organisationAdminUser.service');

const createUser = asyncHandler(async (req, res) => {
  const member = await organisationAdminUserService.createUser(req.user, req.body);
  res.status(201).json({ success: true, data: { member } });
});

const listUsers = asyncHandler(async (req, res) => {
  const data = await organisationAdminUserService.listUsers(req.user, req.query);
  res.status(200).json({ success: true, data });
});

const getUser = asyncHandler(async (req, res) => {
  const data = await organisationAdminUserService.getUser(req.user, req.params.memberId);
  res.status(200).json({ success: true, data });
});

const approveUser = asyncHandler(async (req, res) => {
  const member = await organisationAdminUserService.approveUser(req.user, req.params.memberId);
  res.status(200).json({ success: true, data: { member } });
});

const impersonateUser = asyncHandler(async (req, res) => {
  const data = await organisationAdminUserService.impersonateUser(
    req.user,
    req.params.memberId,
    getClientInfo(req)
  );
  res.status(200).json({ success: true, data });
});

const listSessions = asyncHandler(async (req, res) => {
  const data = await organisationAdminUserService.listSessions(
    req.user,
    req.params.memberId,
    req.query
  );
  res.status(200).json({ success: true, data });
});

const listSessionActivities = asyncHandler(async (req, res) => {
  const data = await organisationAdminUserService.listSessionActivities(
    req.user,
    req.params.memberId,
    req.params.sessionId,
    req.query
  );
  res.status(200).json({ success: true, data });
});

module.exports = {
  createUser,
  listUsers,
  getUser,
  approveUser,
  impersonateUser,
  listSessions,
  listSessionActivities,
};
