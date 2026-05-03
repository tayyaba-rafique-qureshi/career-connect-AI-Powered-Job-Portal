const Job = require('../models/Job')
const Application = require('../models/Application')
const User = require('../models/User')

// ─── Public ───────────────────────────────────────────────────────────────────

// GET /api/jobs — all active jobs (public)
exports.getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ status: 'active' }).populate('postedBy', 'name email employerProfile')
    res.json(jobs)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/jobs/:id — single job (public — only active jobs)
exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, status: 'active' })
      .populate('postedBy', 'name email employerProfile')
    if (!job) return res.status(404).json({ message: 'Job not found' })
    // increment views only for active, publicly visible jobs
    job.views = (job.views || 0) + 1
    await job.save()
    res.json(job)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ─── Employer ─────────────────────────────────────────────────────────────────

// POST /api/jobs — create job (employer only)
exports.createJob = async (req, res) => {
  try {
    const employer = await User.findById(req.user.id)
    const companyName = employer?.employerProfile?.companyInfo?.name || employer?.name || 'Unknown Company'

    // Explicitly pick allowed fields so status can't be bypassed
    const {
      title, description, location, requiredSkills, skills,
      experienceLevel, jobType, workMode, salaryMin, salaryMax, status
    } = req.body

    const validStatuses = ['active', 'draft', 'closed']
    const resolvedStatus = validStatuses.includes(status) ? status : 'draft'

    console.log(`[createJob] employer=${req.user.id} title="${title}" status="${resolvedStatus}"`)

    const job = await Job.create({
      title, description, location, requiredSkills, skills,
      experienceLevel, jobType, workMode, salaryMin, salaryMax,
      status: resolvedStatus,
      company: companyName,
      postedBy: req.user.id
    })

    console.log(`[createJob] saved _id=${job._id} status="${job.status}"`)
    res.status(201).json(job)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/jobs/employer/mine — all jobs by logged-in employer
exports.getEmployerJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ postedBy: req.user.id }).sort({ createdAt: -1 })

    // Attach application count to each job
    const jobsWithCounts = await Promise.all(
      jobs.map(async (job) => {
        const count = await Application.countDocuments({ job: job._id })
        return { ...job.toObject(), applicationCount: count }
      })
    )
    res.json(jobsWithCounts)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// PUT /api/jobs/:id — edit job (employer only, must own it)
exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, postedBy: req.user.id })
    if (!job) return res.status(404).json({ message: 'Job not found or not authorized' })

    const {
      title, description, location, requiredSkills, skills,
      experienceLevel, jobType, workMode, salaryMin, salaryMax, status
    } = req.body

    const validStatuses = ['active', 'draft', 'closed']
    if (title !== undefined)           job.title           = title
    if (description !== undefined)     job.description     = description
    if (location !== undefined)        job.location        = location
    if (requiredSkills !== undefined)  job.requiredSkills  = requiredSkills
    if (skills !== undefined)          job.skills          = skills
    if (experienceLevel !== undefined) job.experienceLevel = experienceLevel
    if (jobType !== undefined)         job.jobType         = jobType
    if (workMode !== undefined)        job.workMode        = workMode
    if (salaryMin !== undefined)       job.salaryMin       = salaryMin
    if (salaryMax !== undefined)       job.salaryMax       = salaryMax
    if (status !== undefined && validStatuses.includes(status)) job.status = status

    console.log(`[updateJob] _id=${job._id} status="${job.status}"`)
    await job.save()
    res.json(job)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// DELETE /api/jobs/:id — delete job (employer only, must own it)
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findOneAndDelete({ _id: req.params.id, postedBy: req.user.id })
    if (!job) return res.status(404).json({ message: 'Job not found or not authorized' })
    // Also remove all applications for this job
    await Application.deleteMany({ job: req.params.id })
    res.json({ message: 'Job deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// PATCH /api/jobs/:id/status — change job status
exports.updateJobStatus = async (req, res) => {
  try {
    const { status } = req.body
    const validStatuses = ['active', 'draft', 'closed']
    if (!validStatuses.includes(status))
      return res.status(400).json({ message: 'Invalid status' })

    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, postedBy: req.user.id },
      { status },
      { new: true }
    )
    if (!job) return res.status(404).json({ message: 'Job not found or not authorized' })
    res.json(job)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/jobs/:id/applicants — get all applicants for a job with mock AI scores
exports.getJobApplicants = async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, postedBy: req.user.id })
    if (!job) return res.status(404).json({ message: 'Job not found or not authorized' })

    const applications = await Application.find({ job: req.params.id })
      .populate('applicant', 'name email avatar applicantProfile')
      .sort({ createdAt: -1 })

    const jobSkills = job.requiredSkills || job.skills || []

    const enriched = applications.map((app) => {
      // Deterministic mock score seeded by applicant ID until AI service is connected
      const idSum = app.applicant._id.toString()
        .split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
      const mockScore = app.aiScore !== null
        ? app.aiScore
        : 60 + (idSum % 40) // 60–99

      // Skills matched (mock: compare applicant skills to job required skills)
      const applicantSkills = (app.applicant.applicantProfile?.skills || [])
        .map(s => (typeof s === 'string' ? s : s.name).toLowerCase())
      const matched = jobSkills.filter(s => applicantSkills.includes(s.toLowerCase()))
      const missing = jobSkills.filter(s => !applicantSkills.includes(s.toLowerCase()))

      return {
        ...app.toObject(),
        matchScore: mockScore,
        skillsMatched: matched.length,
        totalSkills: jobSkills.length,
        matchedSkills: matched,
        missingSkills: missing
      }
    })

    // Sort by match score descending
    enriched.sort((a, b) => b.matchScore - a.matchScore)

    res.json(enriched)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/jobs/employer/stats — dashboard stats for employer
exports.getEmployerStats = async (req, res) => {
  try {
    const jobs = await Job.find({ postedBy: req.user.id })
    const jobIds = jobs.map(j => j._id)

    const [totalApplications, interviews, totalViews] = await Promise.all([
      Application.countDocuments({ job: { $in: jobIds } }),
      Application.countDocuments({ job: { $in: jobIds }, interview: { $ne: null } }),
      Promise.resolve(jobs.reduce((sum, j) => sum + (j.views || 0), 0))
    ])

    const activeJobs = jobs.filter(j => j.status === 'active').length

    res.json({ activeJobs, totalApplications, interviews, totalViews })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
