const asyncHandler = require('../../../utils/asyncHandler');
const { getClientInfo } = require('../../../utils/requestInfo');
const memberService = require('../services/member.service');

/** Same handlers serve the admins list and the users list; `role` picks which one */
const createMemberController = (role) => ({
  create: asyncHandler(async (req, res) => {
    const member = await memberService.createMember(req.user.id, role, req.body);
    res.status(201).json({ success: true, data: { member } });
  }),

  list: asyncHandler(async (req, res) => {
    const data = await memberService.listMembers(req.user.id, role, req.query);
    res.status(200).json({ success: true, data });
  }),

  get: asyncHandler(async (req, res) => {
    const data = await memberService.getMember(req.user.id, role, req.params.memberId);
    res.status(200).json({ success: true, data });
  }),

  remove: asyncHandler(async (req, res) => {
    await memberService.deleteMember(req.user.id, role, req.params.memberId);
    res.status(200).json({ success: true, message: 'Profile deleted' });
  }),

  approve: asyncHandler(async (req, res) => {
    const member = await memberService.approveMember(req.user.id, role, req.params.memberId);
    res.status(200).json({ success: true, data: { member } });
  }),

  impersonate: asyncHandler(async (req, res) => {
    const data = await memberService.impersonate(
      req.user.id,
      role,
      req.params.memberId,
      getClientInfo(req)
    );
    res.status(200).json({ success: true, data });
  }),

  listSessions: asyncHandler(async (req, res) => {
    const data = await memberService.listSessions(
      req.user.id,
      role,
      req.params.memberId,
      req.query
    );
    res.status(200).json({ success: true, data });
  }),

  listSessionActivities: asyncHandler(async (req, res) => {
    const data = await memberService.listSessionActivities(
      req.user.id,
      role,
      req.params.memberId,
      req.params.sessionId,
      req.query
    );
    res.status(200).json({ success: true, data });
  }),
});

module.exports = { createMemberController };
