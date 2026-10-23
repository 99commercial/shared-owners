const asyncHandler = require('../../../utils/asyncHandler');
const { getClientInfo } = require('../../../utils/requestInfo');
const adminCompanyMemberService = require('../services/adminCompanyMember.service');

/** Same handlers serve a company's admins list and users list; `role` picks which one */
const createCompanyMemberController = (role) => ({
  list: asyncHandler(async (req, res) => {
    const data = await adminCompanyMemberService.listMembers(req.params.companyId, role, req.query);
    res.status(200).json({ success: true, data });
  }),

  get: asyncHandler(async (req, res) => {
    const data = await adminCompanyMemberService.getMember(
      req.params.companyId,
      role,
      req.params.memberId
    );
    res.status(200).json({ success: true, data });
  }),

  remove: asyncHandler(async (req, res) => {
    const data = await adminCompanyMemberService.deleteMember(
      req.params.companyId,
      role,
      req.params.memberId,
      req.body
    );
    res.status(200).json({ success: true, message: 'Profile deleted', data });
  }),

  update: asyncHandler(async (req, res) => {
    const member = await adminCompanyMemberService.updateMember(
      req.params.companyId,
      role,
      req.params.memberId,
      req.body
    );
    res.status(200).json({ success: true, message: 'Profile updated', data: { member } });
  }),

  impersonate: asyncHandler(async (req, res) => {
    const data = await adminCompanyMemberService.impersonate(
      req.user,
      req.params.companyId,
      role,
      req.params.memberId,
      getClientInfo(req)
    );
    res.status(200).json({ success: true, data });
  }),

  listSessions: asyncHandler(async (req, res) => {
    const data = await adminCompanyMemberService.listSessions(
      req.params.companyId,
      role,
      req.params.memberId,
      req.query
    );
    res.status(200).json({ success: true, data });
  }),

  listSessionActivities: asyncHandler(async (req, res) => {
    const data = await adminCompanyMemberService.listSessionActivities(
      req.params.companyId,
      role,
      req.params.memberId,
      req.params.sessionId,
      req.query
    );
    res.status(200).json({ success: true, data });
  }),
});

module.exports = { createCompanyMemberController };
