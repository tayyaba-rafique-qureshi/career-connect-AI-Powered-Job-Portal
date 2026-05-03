const router = require('express').Router()
const {
  getAllJobs,
  getJobById,
  createJob,
  getEmployerJobs,
  updateJob,
  deleteJob,
  updateJobStatus,
  getJobApplicants,
  getEmployerStats
} = require('../controllers/jobController')
const { protect } = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')

// Public
router.get('/', getAllJobs)

// Employer-specific — must come before /:id to avoid route conflicts
router.get('/employer/mine',  protect, requireRole('employer', 'recruiter'), getEmployerJobs)
router.get('/employer/stats', protect, requireRole('employer', 'recruiter'), getEmployerStats)

// Single job (public)
router.get('/:id', getJobById)

// Employer CRUD
router.post('/',              protect, requireRole('employer', 'recruiter'), createJob)
router.put('/:id',            protect, requireRole('employer', 'recruiter'), updateJob)
router.delete('/:id',         protect, requireRole('employer', 'recruiter'), deleteJob)
router.patch('/:id/status',   protect, requireRole('employer', 'recruiter'), updateJobStatus)
router.get('/:id/applicants', protect, requireRole('employer', 'recruiter'), getJobApplicants)

module.exports = router
