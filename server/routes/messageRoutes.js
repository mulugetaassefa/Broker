const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { auth, adminAuth } = require('../middleware/auth');

// User routes
router.route('/')
  .post(auth, messageController.sendMessage);

router.route('/conversations')
  .get(auth, messageController.getConversations);

// Handle both conversation_* format and user ID patterns
router.get('/conversation/:userId', auth, messageController.getOrCreateConversation);
router.get('/:conversationId', auth, messageController.getMessages);

// Admin routes
router.route('/admin/reply')
  .post(auth, adminAuth, messageController.adminReply);

module.exports = router;
