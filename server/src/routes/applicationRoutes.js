const router = require('express').Router()
const {
  applyToJob,
  getMyApplications,
  updateStatus,
  scheduleInterview
} = require('../controllers/applicationController')
const { protect } = require('../middleware/authMiddleware')

router.get('/me',                  protect, getMyApplications)
router.post('/:jobId',             protect, applyToJob)
router.patch('/:id/status',        protect, updateStatus)
router.post('/:id/interview',      protect, scheduleInterview)

module.exports = router
