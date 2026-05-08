const router = require('express').Router()
const axios = require('axios')
const { protect } = require('../middleware/authMiddleware')
const User = require('../models/User')
const Job = require('../models/Job')

// POST /api/ai/match-resume-job
// Called when applicant clicks a job card — lazy AI scoring
router.post('/match-resume-job', protect, async (req, res) => {
  try {
    const { jobId } = req.body
    const [user, job] = await Promise.all([
      User.findById(req.user.id),
      Job.findById(jobId)
    ])

    if (!job) return res.status(404).json({ message: 'Job not found' })

    const resumeText = user?.applicantProfile?.resume?.rawText || ''
    const applicantSkills = (user?.applicantProfile?.skills || []).map(s => s.name || s).join(', ')
    const fullProfile = `${resumeText}\nSkills: ${applicantSkills}`

    const jobText = `${job.title}\n${job.description}\nRequired: ${(job.requiredSkills || []).join(', ')}`

    // Call Python AI service
    const { data } = await axios.post(
      `${process.env.AI_SERVICE_URL}/analyze`,
      { resume: fullProfile || 'No resume', job_description: jobText },
      { timeout: 15000 }
    )

    const score = Math.round((data.score || 0) * 100)

    // Compute matched/missing skills
    const applicantSkillList = (user?.applicantProfile?.skills || []).map(s => (s.name || s).toLowerCase())
    const requiredSkills = job.requiredSkills || []
    const skillsMatched = requiredSkills.filter(s => applicantSkillList.includes(s.toLowerCase()))
    const skillsMissing = requiredSkills.filter(s => !applicantSkillList.includes(s.toLowerCase()))

    res.json({ matchScore: score, skillsMatched, skillsMissing })
  } catch (err) {
    console.error('[AI Match]', err.message)
    // Graceful fallback — don't crash the UI
    res.json({ matchScore: null, skillsMatched: [], skillsMissing: [] })
  }
})

module.exports = router
