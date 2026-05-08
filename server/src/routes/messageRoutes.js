const router = require('express').Router()
const {
  getConversations,
  getMessages,
  sendMessage,
  bootstrapConversation,
  getUnreadCount,
  markMessageRead
} = require('../controllers/messageController')
const { protect } = require('../middleware/authMiddleware')

router.use(protect) // All message routes require authentication

router.get('/conversations', getConversations)
router.get('/unread-count', getUnreadCount)
router.get('/bootstrap', bootstrapConversation)
router.get('/:conversationId', getMessages)
router.post('/', sendMessage)
router.patch('/:id/read', markMessageRead)

module.exports = router
