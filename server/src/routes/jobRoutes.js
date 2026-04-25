const router = require('express').Router()
const { getAllJobs, createJob, getJobById } = require('../controllers/jobController')
const { protect } = require('../middleware/authMiddleware')

router.get('/', getAllJobs)
router.get('/:id', getJobById)
router.post('/', protect, createJob)

module.exports = router
