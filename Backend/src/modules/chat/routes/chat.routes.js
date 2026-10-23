const express = require('express');
const { authenticate, authorize } = require('../../../middleware/auth');
const { ROLES } = require('../../../common/roles');
const chatController = require('../controllers/chat.controller');

const router = express.Router();

const chatOnly = [
  authenticate,
  authorize(ROLES.USER, ROLES.ORGANISATION, ROLES.ORGANISATION_ADMIN, ROLES.ORGANISATION_USER),
];

router.get('/unread-count', ...chatOnly, chatController.unreadCount);
router.get('/', ...chatOnly, chatController.list);
router.post('/properties/:propertyId', ...chatOnly, chatController.start);
router.get('/:conversationId', ...chatOnly, chatController.getOne);
router.get('/:conversationId/messages', ...chatOnly, chatController.messages);
router.post('/:conversationId/messages', ...chatOnly, chatController.send);

module.exports = router;
