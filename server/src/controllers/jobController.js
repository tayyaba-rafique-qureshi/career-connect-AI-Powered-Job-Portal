const Job = require('../models/Job')
const Application = require('../models/Application')
const User = require('../models/User')
const Notification = require('../models/Notification')
const Report = require('../models/Report')
const { sendJobMatchEmail } = require('../services/emailService')
const aiService = require('../services/aiService')

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

// GET /api/jobs/search?title=&location= — regex search (public)
exports.searchJobs = async (req, res) => {
  try {
    const { title, location } = req.query
    const filter = { status: 'active' }

    if (title && title.trim()) {
      const regex = new RegExp(title.trim(), 'i')
      filter.$or = [
        { title: regex },
        { description: regex },
        { company: regex }
      ]
    }

    if (location && location.trim()) {
      filter.location = { $regex: location.trim(), $options: 'i' }
    }

    const jobs = await Job.find(filter)
      .populate('postedBy', 'name email employerProfile')
      .sort({ createdAt: -1 })

    res.json(jobs)
  } catch (err) {
    console.error('[searchJobs]', err.message)
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

// POST /api/jobs/:id/report — report a job (public/applicant)
exports.reportJob = async (req, res) => {
  try {
    const { reason, description } = req.body
    if (!reason) return res.status(400).json({ message: 'Reason is required' })

    const job = await Job.findById(req.params.id)
    if (!job) return res.status(404).json({ message: 'Job not found' })

    const report = await Report.create({
      job: job._id,
      reportedBy: req.user.id,
      reason,
<<<<<<< HEAD
      description: description || '',
      status: 'pending',
      resolved: false
=======
      description: description || ''
>>>>>>> f9873058d0e7eb905fe9fba20468adc7056e7fa3
    })

    res.status(201).json({ message: 'Job reported successfully', reportId: report._id })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ─── Employer ─────────────────────────────────────────────────────────────────

// POST /api/jobs — create job (employer only)
exports.createJob = async (req, res) => {
  try {
<<<<<<< HEAD
    // ── Credit check ──────────────────────────────────────────────────────────
    const poster = await User.findById(req.user.id).select('jobPostCredits')
    if (!poster) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Normalize: clamp any missing/null/negative value to 0 before checking
    if (
      poster.jobPostCredits === undefined ||
      poster.jobPostCredits === null ||
      poster.jobPostCredits < 0
    ) {
      await User.findByIdAndUpdate(req.user.id, { $set: { jobPostCredits: 0 } })
      poster.jobPostCredits = 0
    }

    if (poster.jobPostCredits === 0) {
      return res.status(403).json({
        error:            'NO_CREDITS',
        message:          'You have no job post credits remaining. Please purchase more.',
        creditsRemaining: 0,
      })
    }

    // Atomic deduct — only fires if credits > 0, prevents race-condition negatives
    const deducted = await User.findOneAndUpdate(
      { _id: req.user.id, jobPostCredits: { $gt: 0 } },
      { $inc: { jobPostCredits: -1 } },
      { new: true }
    )
    if (!deducted) {
      // Another request beat us to the last credit
      return res.status(403).json({
        error:            'NO_CREDITS',
        message:          'You have no job post credits remaining. Please purchase more.',
        creditsRemaining: 0,
      })
    }
    // ─────────────────────────────────────────────────────────────────────────

=======
>>>>>>> f9873058d0e7eb905fe9fba20468adc7056e7fa3
    const employer = await User.findById(req.user.id)
    const companyName = employer?.employerProfile?.companyInfo?.name || employer?.name || 'Unknown Company'

    // Explicitly pick allowed fields so status can't be bypassed
    const {
      company,
      title, description, location, requiredSkills, skills,
      experienceLevel, jobType, workMode, salaryMin, salaryMax, salaryType, status
    } = req.body

    const validStatuses = ['active', 'draft', 'closed']
    const resolvedStatus = validStatuses.includes(status) ? status : 'draft'

    console.log(`[createJob] employer=${req.user.id} title="${title}" status="${resolvedStatus}"`)

    const job = await Job.create({
      title, description, location, requiredSkills, skills,
      experienceLevel, jobType, workMode, salaryMin, salaryMax,
      salaryType: salaryType || 'yearly',
      status: resolvedStatus,
      company: (company && String(company).trim()) || companyName,
      postedBy: req.user.id
    })

    console.log(`[createJob] saved _id=${job._id} status="${job.status}"`)

    // Fire-and-forget: notify matching applicants if job is published
    if (resolvedStatus === 'active') {
      emailMatchingApplicants(job).catch(err => console.error('[emailMatchingApplicants]', err.message))
    }

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
      company,
      title, description, location, requiredSkills, skills,
      experienceLevel, jobType, workMode, salaryMin, salaryMax, salaryType, status
    } = req.body

    const validStatuses = ['active', 'draft', 'closed']
    if (company !== undefined)         job.company         = company
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
    if (salaryType !== undefined)      job.salaryType      = salaryType
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

<<<<<<< HEAD
// GET /api/jobs/:id/applicants — get all applicants for a job with mock AI scores
=======
// GET /api/jobs/:id/applicants — get all applicants for a job, enriched with live AI match scores
>>>>>>> f9873058d0e7eb905fe9fba20468adc7056e7fa3
exports.getJobApplicants = async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, postedBy: req.user.id })
    if (!job) return res.status(404).json({ message: 'Job not found or not authorized' })

    const applications = await Application.find({ job: req.params.id })
      .populate('applicant', 'name email avatar applicantProfile')
      .sort({ createdAt: -1 })

    // Auto-mark past interviews as completed for recruiter views.
    for (const app of applications) {
      if (app.interview?.scheduledAt && app.interview?.status !== 'completed') {
        if (new Date(app.interview.scheduledAt) < new Date()) {
          app.interview.status = 'completed'
          await app.save()
        }
      }
    }

    const jobSkills = job.requiredSkills || job.skills || []

<<<<<<< HEAD
    // Enrich each application with an AI match score.
    // Strategy:
    //   1. If aiScore was set within the last 24 hours, use the cached value.
    //   2. Otherwise call the AI service (non-blocking per applicant).
    //   3. If AI returns null/errors, fall back to the deterministic mock.
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000

    const enriched = await Promise.all(applications.map(async (app) => {
      // ── Skill overlap (always computed locally — fast) ────────────────────
=======
    // Build enriched applicant list with real AI match scores.
    // Strategy: prefer the score saved on the Application at apply-time;
    // if missing (legacy data), call the AI service live; if AI is
    // unreachable, fall back to a local skill-overlap ratio so the
    // recruiter still sees a useful number.
    const enriched = await Promise.all(applications.map(async (app) => {
>>>>>>> f9873058d0e7eb905fe9fba20468adc7056e7fa3
      const applicantSkills = (app.applicant.applicantProfile?.skills || [])
        .map(s => (typeof s === 'string' ? s : s.name).toLowerCase())
      const matched = jobSkills.filter(s => applicantSkills.includes(s.toLowerCase()))
      const missing = jobSkills.filter(s => !applicantSkills.includes(s.toLowerCase()))

<<<<<<< HEAD
      // ── Score resolution ──────────────────────────────────────────────────
      let matchScore = null

      // 1. Use cached aiScore if it was set within 24 hours
      const scoreAge = app.updatedAt ? Date.now() - new Date(app.updatedAt).getTime() : Infinity
      if (app.aiScore !== null && app.aiScore !== undefined && scoreAge < TWENTY_FOUR_HOURS) {
        matchScore = app.aiScore
      } else {
        // 2. Call AI service
        try {
          const aiResult = await aiService.analyzeMatch(
            app.applicant._id.toString(),
            job._id.toString()
          )
          if (aiResult.matchScore !== null && aiResult.matchScore !== undefined) {
            matchScore = aiResult.matchScore

            // Persist the fresh score so the next load within 24h uses the cache
            await Application.findByIdAndUpdate(app._id, {
              aiScore:       matchScore,
              skillsMatched: aiResult.skillsMatched,
              skillsMissing: aiResult.skillsMissing,
            })
          }
        } catch {
          // AI call failed — fall through to mock
        }
      }

      // 3. Mock fallback: deterministic score seeded by applicant ID
      if (matchScore === null || matchScore === undefined) {
        const idSum = app.applicant._id.toString()
          .split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
        matchScore = 60 + (idSum % 40) // 60–99
      }

=======
      let matchScore = null
      if (app.aiScore != null) {
        // Stored score is 0-1 → convert to 0-100 percentage
        matchScore = Math.round(app.aiScore * 100)
      } else {
        const live = await aiService.matchApplicantToJob(
          app.applicant._id.toString(),
          job._id.toString()
        )
        if (live.matchScore != null) {
          matchScore = Math.round(live.matchScore)
        } else if (jobSkills.length > 0) {
          matchScore = Math.round((matched.length / jobSkills.length) * 100)
        } else {
          matchScore = 0
        }
      }

>>>>>>> f9873058d0e7eb905fe9fba20468adc7056e7fa3
      return {
        ...app.toObject(),
        matchScore,
        skillsMatched: matched.length,
<<<<<<< HEAD
        totalSkills:   jobSkills.length,
        matchedSkills: matched,
        missingSkills: missing,
=======
        totalSkills: jobSkills.length,
        matchedSkills: matched,
        missingSkills: missing
>>>>>>> f9873058d0e7eb905fe9fba20468adc7056e7fa3
      }
    }))

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

// ─── Applicant ────────────────────────────────────────────────────────────────

// GET /api/jobs/recommended — personalized job recommendations
exports.getRecommendedJobs = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user || !user.applicantProfile) {
      return res.json([])
    }

    const prefs = user.applicantProfile.preferences || {}
    const userSkills = (user.applicantProfile.skills || [])
      .map(s => (typeof s === 'string' ? s : s.name || '').toLowerCase())

    const filter = { status: 'active' }
    const conditions = []

    // Location match
    if (prefs.preferredLocations?.length > 0) {
      const locRegexes = prefs.preferredLocations.map(l => new RegExp(l, 'i'))
      conditions.push({ location: { $in: locRegexes } })
    }

    // Job type match
    if (prefs.jobType?.length > 0) {
      conditions.push({ jobType: { $in: prefs.jobType } })
    }

    // Work mode match
    if (prefs.workMode) {
      conditions.push({ workMode: prefs.workMode })
    }

    // Skills match — at least 1 skill overlaps
    if (userSkills.length > 0) {
      const skillRegexes = userSkills.map(s => new RegExp(`^${s}$`, 'i'))
      conditions.push({ requiredSkills: { $in: skillRegexes } })
    }

    if (conditions.length > 0) {
      // Use $or to be inclusive — match ANY preference criteria
      filter.$or = conditions
    }

    const jobs = await Job.find(filter)
      .populate('postedBy', 'name email employerProfile')
      .sort({ createdAt: -1 })
      .limit(10)

    res.json(jobs)
  } catch (err) {
    console.error('[getRecommendedJobs]', err.message)
    res.status(500).json({ message: err.message })
  }
}

// GET /api/jobs/:id/applicants/export — export applicants as Excel
exports.exportApplicants = async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, postedBy: req.user.id })
    if (!job) return res.status(404).json({ message: 'Job not found or not authorized' })

    const applications = await Application.find({ job: req.params.id })
      .populate('applicant', 'name email applicantProfile')
      .sort({ createdAt: -1 })

    const jobSkills = job.requiredSkills || job.skills || []

    // Build CSV as fallback (no exceljs dependency needed)
    const headers = ['Name', 'Email', 'Phone', 'Current Title', 'Experience', 'Skills', 'Skills Matched', 'Applied Date', 'Status']
    const rows = applications.map(app => {
      const profile = app.applicant?.applicantProfile || {}
      const pro = profile.professionalInfo || {}
      const basic = profile.basicInfo || {}
      const applicantSkills = (profile.skills || []).map(s => typeof s === 'string' ? s : s.name || '')
      const matched = jobSkills.filter(s => applicantSkills.map(x => x.toLowerCase()).includes(s.toLowerCase()))

      return [
        app.applicant?.name || '',
        app.applicant?.email || '',
        basic.phone || '',
        pro.currentTitle || '',
        pro.yearsOfExp || '',
        applicantSkills.join('; '),
        `${matched.length}/${jobSkills.length}`,
        new Date(app.createdAt).toLocaleDateString(),
        app.status || 'pending'
      ]
    })

    // Generate CSV
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const filename = `${job.title.replace(/[^a-zA-Z0-9]/g, '_')}_applicants.csv`
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(csvContent)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ─── Helper: Email matching applicants ────────────────────────────────────────
async function emailMatchingApplicants(job) {
  try {
    const filter = {
      role: 'applicant',
      onboardingComplete: true
    }

    const applicants = await User.find(filter)

    let matchCount = 0
    for (const applicant of applicants) {
      const prefs = applicant.applicantProfile?.preferences || {}

      // Check location match
      const locMatch = !prefs.preferredLocations?.length ||
        prefs.preferredLocations.some(l => job.location?.toLowerCase().includes(l.toLowerCase()))

      // Check job type match
      const typeMatch = !prefs.jobType?.length ||
        prefs.jobType.some(t => job.jobType?.includes(t))

      // Check work mode match
      const modeMatch = !prefs.workMode || prefs.workMode === job.workMode

      if (locMatch && typeMatch && modeMatch) {
        matchCount++
        // Create notification
        await Notification.create({
          user: applicant._id,
          type: 'job_match',
          title: `New ${job.title} job in ${job.location || 'your area'}`,
          message: `${job.company} is hiring a ${job.title}. Check it out!`,
          link: `/dashboard/applicant`
        })

        // Send email (fire-and-forget)
        sendJobMatchEmail({ applicant, job }).catch(() => {})
      }
    }
    console.log(`[emailMatchingApplicants] Notified ${matchCount} applicants for "${job.title}"`)
  } catch (err) {
    console.error('[emailMatchingApplicants]', err.message)
  }
}
