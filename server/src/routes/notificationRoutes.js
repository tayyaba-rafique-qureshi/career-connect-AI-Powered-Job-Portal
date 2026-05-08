const router = require('express').Router()
const { protect } = require('../middleware/authMiddleware')
const { getNotifications, markRead, markAllRead } = require('../controllers/notificationController')

router.get('/',              protect, getNotifications)
router.patch('/read-all',    protect, markAllRead)
router.patch('/:id/read',    protect, markRead)

module.exports = router
