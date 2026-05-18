const router = require('express').Router()
const { protect } = require('../middleware/authMiddleware')
const { matchApplicantToJob, getRecommendations } = require('../services/aiService')

/**
 * POST /api/ai/match-resume-job
 * Called when applicant clicks a job card — lazy AI scoring.
 * Proxies to Python AI service using applicant_id + job_id.
 */
router.post('/match-resume-job', protect, async (req, res) => {
  try {
    const { jobId } = req.body
    if (!jobId) return res.status(400).json({ message: 'jobId is required' })

    const result = await matchApplicantToJob(req.user.id, jobId)
    res.json(result)
  } catch (err) {
    console.error('[AI Match]', err.message)
<<<<<<< HEAD
    // Surface missing-resume signal to the client so new users see a prompt
    const detail = err.response?.data?.detail || ''
    if (err.response?.status === 400 && detail.toLowerCase().includes('no resume text')) {
      return res.json({ matchScore: null, skillsMatched: [], skillsMissing: [], noResumeText: true })
    }
=======
>>>>>>> f9873058d0e7eb905fe9fba20468adc7056e7fa3
    res.json({ matchScore: null, skillsMatched: [], skillsMissing: [] })
  }
})

/**
 * GET /api/ai/recommend
 * Returns AI-ranked job recommendations for the logged-in applicant.
 */
router.get('/recommend', protect, async (req, res) => {
  try {
    const threshold = parseFloat(req.query.threshold) || 60
    const jobs = await getRecommendations(req.user.id, threshold)
    res.json({ jobs })
  } catch (err) {
    console.error('[AI Recommend]', err.message)
    res.json({ jobs: [] })
  }
})

module.exports = router
