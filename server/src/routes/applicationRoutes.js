const router = require('express').Router()
const {
  applyToJob,
  getMyApplications,
  checkApplied,
  archiveApplication,
  unarchiveApplication,
  updateStatus,
  scheduleInterview,
  rescheduleInterview,
  downloadApplicantResume,
  dislikeJob,
  undislikeJob,
  getDislikedJobIds
} = require('../controllers/applicationController')
const { protect } = require('../middleware/authMiddleware')

router.get('/me',                  protect, getMyApplications)
router.get('/check/:jobId',        protect, checkApplied)
router.get('/disliked-ids',        protect, getDislikedJobIds)
router.post('/dislike/:jobId',     protect, dislikeJob)
router.delete('/dislike/:jobId',   protect, undislikeJob)
router.post('/:jobId',             protect, applyToJob)
router.post('/:id/archive',        protect, archiveApplication)
router.post('/:id/unarchive',      protect, unarchiveApplication)
router.patch('/:id/status',        protect, updateStatus)
router.post('/:id/interview',      protect, scheduleInterview)
router.patch('/:id/reschedule',    protect, rescheduleInterview)
router.get('/:id/resume',          protect, downloadApplicantResume)

module.exports = router
