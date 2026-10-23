const asyncHandler = require('../../../utils/asyncHandler');
const chatService = require('../services/chat.service');

const list = asyncHandler(async (req, res) => {
  const data = await chatService.listConversations(req.user, req.query);
  res.status(200).json({ success: true, data });
});

const unreadCount = asyncHandler(async (req, res) => {
  const data = await chatService.unreadCount(req.user);
  res.status(200).json({ success: true, data });
});

const getOne = asyncHandler(async (req, res) => {
  const data = await chatService.getConversation(req.user, req.params.conversationId);
  res.status(200).json({ success: true, data });
});

const messages = asyncHandler(async (req, res) => {
  const data = await chatService.listMessages(req.user, req.params.conversationId, req.query);
  res.status(200).json({ success: true, data });
});

const send = asyncHandler(async (req, res) => {
  const data = await chatService.sendMessage(req.user, req.params.conversationId, req.body);
  res.status(201).json({ success: true, data });
});

const start = asyncHandler(async (req, res) => {
  const data = await chatService.startConversation(req.user, req.params.propertyId, req.body);
  res.status(data.created ? 201 : 200).json({ success: true, data });
});

module.exports = {
  list,
  unreadCount,
  getOne,
  messages,
  send,
  start,
};
