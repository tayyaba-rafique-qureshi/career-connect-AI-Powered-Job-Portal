const router = require('express').Router()
const {
  getAllJobs,
  getJobById,
  searchJobs,
  createJob,
  getEmployerJobs,
  updateJob,
  deleteJob,
  updateJobStatus,
  getJobApplicants,
  getEmployerStats,
  getRecommendedJobs,
  exportApplicants,
  reportJob
} = require('../controllers/jobController')
const { protect } = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')

// Public
router.get('/', getAllJobs)

// Search — must come before /:id to avoid route conflict
router.get('/search', searchJobs)

// Recommendations — protected, applicant only
router.get('/recommended', protect, getRecommendedJobs)

// Employer-specific — must come before /:id to avoid route conflicts
router.get('/employer/mine',  protect, requireRole('employer', 'recruiter'), getEmployerJobs)
router.get('/employer/stats', protect, requireRole('employer', 'recruiter'), getEmployerStats)

// Single job (public)
router.get('/:id', getJobById)

// Report job (applicant/public)
router.post('/:id/report', protect, reportJob)

// Employer CRUD
router.post('/',              protect, requireRole('employer', 'recruiter'), createJob)
router.put('/:id',            protect, requireRole('employer', 'recruiter'), updateJob)
router.delete('/:id',         protect, requireRole('employer', 'recruiter'), deleteJob)
router.patch('/:id/status',   protect, requireRole('employer', 'recruiter'), updateJobStatus)
router.get('/:id/applicants', protect, requireRole('employer', 'recruiter'), getJobApplicants)
router.get('/:id/applicants/export', protect, requireRole('employer', 'recruiter'), exportApplicants)

module.exports = router
