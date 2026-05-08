const router = require('express').Router()
const { protect } = require('../middleware/authMiddleware')
const { saveJob, unsaveJob, getSavedJobs, getSavedJobIds } = require('../controllers/savedJobController')

router.get('/',         protect, getSavedJobs)
router.get('/ids',      protect, getSavedJobIds)
router.post('/:jobId',  protect, saveJob)
router.delete('/:jobId',protect, unsaveJob)

module.exports = router
