const Application = require('../models/Application')
const Job = require('../models/Job')
const User = require('../models/User')
const aiService = require('../services/aiService')
const {
  sendApplicationConfirmEmail,
  sendNewApplicationEmail,
  sendStatusUpdateEmail,
  sendInterviewUpdateEmail
} = require('../services/emailService')
const Notification = require('../models/Notification')
const mongoose = require('mongoose')
const { getBucket } = require('../config/gridfs')

function toScheduledDate(date, time) {
  if (!date) return null
  return new Date(`${date}T${time || '00:00'}:00`)
}

function getRescheduleWindowState(interview) {
  if (!interview?.scheduledAt) return { allowed: true }
  const now = new Date()
  const scheduledTime = new Date(interview.scheduledAt)
  if (now > scheduledTime) return { allowed: false, reason: 'Cannot reschedule past interviews' }
  const twoHoursBefore = new Date(scheduledTime.getTime() - 2 * 60 * 60 * 1000)
  if (now > twoHoursBefore) return { allowed: false, reason: 'Cannot reschedule within 2 hours of interview time' }
  return { allowed: true }
}

// POST /api/applications/:jobId — applicant applies to a job
exports.applyToJob = async (req, res) => {
  try {
    const { resumeText, coverLetter } = req.body
    const job = await Job.findById(req.params.jobId)
    if (!job) return res.status(404).json({ message: 'Job not found' })

    // Prevent duplicate applications
    const existing = await Application.findOne({ job: job._id, applicant: req.user.id })
    if (existing) return res.status(400).json({ message: 'Already applied to this job' })

    // Pull applicant profile for skill matching
    const applicant = await User.findById(req.user.id)
    const storedResumeText = applicant?.applicantProfile?.resume?.rawText || ''
    const effectiveResumeText = resumeText || storedResumeText

    // Compute AI score via the AI microservice using ID-based contract.
    // matchApplicantToJob hits POST /api/ai/match with {applicant_id, job_id}
    // and returns { matchScore (0-100), skillsMatched, skillsMissing }.
    const aiResult = await aiService.matchApplicantToJob(req.user.id, job._id.toString())
    // Convert 0-100 to 0-1 to match the existing Application.aiScore convention.
    const aiScore = aiResult.matchScore != null ? aiResult.matchScore / 100 : null

    // Use AI-service skill computation if available, otherwise fall back to local compute.
    const applicantSkillList = (applicant?.applicantProfile?.skills || [])
      .map(s => (typeof s === 'string' ? s : s.name || '').toLowerCase())
    const requiredSkills = job.requiredSkills || []
    const skillsMatched = aiResult.skillsMatched.length
      ? aiResult.skillsMatched
      : requiredSkills.filter(s => applicantSkillList.includes(s.toLowerCase()))
    const skillsMissing = aiResult.skillsMissing.length
      ? aiResult.skillsMissing
      : requiredSkills.filter(s => !applicantSkillList.includes(s.toLowerCase()))

    const application = await Application.create({
      job: job._id,
      applicant: req.user.id,
      resumeText: effectiveResumeText,
      aiScore,
      skillsMatched,
      skillsMissing,
      coverLetter: coverLetter || '',
      appliedAt: new Date()
    })

    sendApplicationConfirmEmail({ applicant, job: { ...job.toObject(), aiScore } })

    if (job.postedBy) {
      const employer = await User.findById(job.postedBy)
      if (employer) {
        sendNewApplicationEmail({ employer, applicant, job: { ...job.toObject(), aiScore } })
        await Notification.create({
          user: employer._id,
          type: 'general',
          title: 'New application',
          message: `${applicant?.name || 'An applicant'} applied for ${job.title}`,
          link: `/dashboard/recruiter/jobs/${job._id}/applicants`,
        }).catch(() => {})
      }
    }

    res.status(201).json({
      applicationId: application._id,
      message: 'Application submitted',
      aiScore,
      skillsMatched,
      skillsMissing
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/applications/check/:jobId — check if applicant has applied
exports.checkApplied = async (req, res) => {
  try {
    const existing = await Application.findOne({ job: req.params.jobId, applicant: req.user.id })
    res.json({ applied: !!existing, applicationId: existing?._id || null })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/applications/me — applicant's own applications (optional ?status= filter)
exports.getMyApplications = async (req, res) => {
  try {
    const filter = { applicant: req.user.id }
    if (req.query.status) filter.status = req.query.status
    const apps = await Application.find(filter)
      .populate('job')
      .sort({ createdAt: -1 })

    // Auto-complete past interviews on page load
    for (const app of apps) {
      if (app.interview?.scheduledAt && app.interview?.status !== 'completed') {
        if (new Date(app.interview.scheduledAt) < new Date()) {
          app.interview.status = 'completed'
          await app.save()
        }
      }
    }

    res.json(apps)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// POST /api/applications/:id/archive — applicant archives an application
exports.archiveApplication = async (req, res) => {
  try {
    const application = await Application.findOne({ _id: req.params.id, applicant: req.user.id })
    if (!application) return res.status(404).json({ message: 'Application not found' })
    application.status = 'archived'
    await application.save()
    res.json(application)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// POST /api/applications/:id/unarchive — applicant unarchives an application
exports.unarchiveApplication = async (req, res) => {
  try {
    const application = await Application.findOne({ _id: req.params.id, applicant: req.user.id })
    if (!application) return res.status(404).json({ message: 'Application not found' })
    if (application.status !== 'archived') return res.status(400).json({ message: 'Application is not archived' })
    
    // Reset to pending, or if it had an interview, maybe shortlisted? We'll just set it back to pending.
    application.status = 'pending'
    await application.save()
    res.json(application)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// PATCH /api/applications/:id/status — employer updates application status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body
    const validStatuses = ['pending', 'reviewed', 'shortlisted', 'rejected', 'accepted']
    if (!validStatuses.includes(status))
      return res.status(400).json({ message: 'Invalid status' })

    const application = await Application.findById(req.params.id)
      .populate('applicant', 'name email')
      .populate('job', 'title company postedBy')

    if (!application) return res.status(404).json({ message: 'Application not found' })

    // Ensure only the job owner can update status
    if (application.job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    const oldStatus = application.status
    application.status = status
    await application.save()

    if (oldStatus !== status) {
      sendStatusUpdateEmail({
        applicant: application.applicant,
        job: application.job,
        status
      })
    }

    // In-app notification for applicant
    if (oldStatus !== status) try {
      await Notification.create({
        user: application.applicant._id,
        type: 'status_update',
        title: 'Application update',
        message: `${application.job.title} at ${application.job.company}: ${status}`,
        link: '/my-jobs?tab=applied',
      })
    } catch {
      // ignore notification failures
    }

    res.json(application)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// POST /api/applications/:id/interview — employer schedules interview
exports.scheduleInterview = async (req, res) => {
  try {
    const { date, time, type, meetingLink, address, notes } = req.body

    const application = await Application.findById(req.params.id)
      .populate('job', 'title company postedBy')
      .populate('applicant', 'name email')

    if (!application) return res.status(404).json({ message: 'Application not found' })

    if (application.job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    // If interview already exists, enforce reschedule constraints.
    if (application.interview?.scheduledAt) {
      const state = getRescheduleWindowState(application.interview)
      if (!state.allowed) return res.status(400).json({ message: state.reason })
    }

    const scheduledAt = toScheduledDate(date, time)
    if (!scheduledAt || Number.isNaN(scheduledAt.getTime()) || scheduledAt < new Date()) {
      return res.status(400).json({ message: 'Interview must be scheduled in the future' })
    }

    application.interview = {
      date,
      time,
      type,
      meetingLink,
      address,
      notes,
      scheduledAt,
      status: 'scheduled'
    }
    application.status = 'shortlisted'
    await application.save()

    sendStatusUpdateEmail({
      applicant: application.applicant,
      job: application.job,
      status: 'shortlisted'
    })
    sendInterviewUpdateEmail({
      applicant: application.applicant,
      job: application.job,
      interview: application.interview,
      isReschedule: false
    })

    // In-app notification for applicant
    try {
      await Notification.create({
        user: application.applicant._id,
        type: 'interview',
        title: 'Interview scheduled',
        message: `${application.job.title} at ${application.job.company}${date ? ` · ${date}` : ''}${time ? ` ${time}` : ''}`,
        link: '/my-jobs?tab=interviews',
      })
    } catch {
      // ignore notification failures
    }

    res.json(application)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// PATCH /api/applications/:id/reschedule — employer reschedules interview
exports.rescheduleInterview = async (req, res) => {
  try {
    const { date, time, meetingLink, address, notes, type } = req.body

    const application = await Application.findById(req.params.id)
      .populate('job', 'title company postedBy')
      .populate('applicant', 'name email')

    if (!application) return res.status(404).json({ message: 'Application not found' })
    if (application.job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' })
    }
    if (!application.interview?.scheduledAt) {
      return res.status(400).json({ message: 'No interview exists to reschedule' })
    }

    const state = getRescheduleWindowState(application.interview)
    if (!state.allowed) return res.status(400).json({ message: state.reason })

    const scheduledAt = toScheduledDate(date || application.interview.date, time || application.interview.time)
    if (!scheduledAt || Number.isNaN(scheduledAt.getTime()) || scheduledAt < new Date()) {
      return res.status(400).json({ message: 'Interview must be scheduled in the future' })
    }

    application.interview = {
      ...application.interview,
      date: date || application.interview.date,
      time: time || application.interview.time,
      type: type || application.interview.type,
      meetingLink: meetingLink ?? application.interview.meetingLink,
      address: address ?? application.interview.address,
      notes: notes ?? application.interview.notes,
      scheduledAt,
      status: 'scheduled'
    }

    await application.save()

    sendInterviewUpdateEmail({
      applicant: application.applicant,
      job: application.job,
      interview: application.interview,
      isReschedule: true
    })

    await Notification.create({
      user: application.applicant._id,
      type: 'interview',
      title: 'Interview rescheduled',
      message: `${application.job.title} at ${application.job.company}${application.interview.date ? ` Â· ${application.interview.date}` : ''}${application.interview.time ? ` ${application.interview.time}` : ''}`,
      link: '/my-jobs?tab=interviews',
    }).catch(() => {})

    res.json(application)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/applications/:id/resume — employer downloads applicant resume (PDF)
exports.downloadApplicantResume = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('job', 'postedBy title')
      .populate('applicant', 'name applicantProfile')

    if (!application) return res.status(404).json({ message: 'Application not found' })

    // Only the job owner (recruiter/employer) can download
    if (application.job?.postedBy?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    const resume = application.applicant?.applicantProfile?.resume
    const fileId = resume?.fileId
    if (!fileId) return res.status(404).json({ message: 'No resume found for this applicant' })

    const bucket = getBucket()
    const oid = new mongoose.Types.ObjectId(fileId)

    const safeName = (resume.fileName || `resume_${application.applicant?._id}.pdf`)
      .replace(/[^a-zA-Z0-9._-]/g, '_')

    res.set('Content-Type', 'application/pdf')
    res.set('Content-Disposition', `attachment; filename="${safeName}"`)
    bucket.openDownloadStream(oid).pipe(res)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ─── Dislike (Not Interested) ─────────────────────────────────────────────────
const DislikedJob = require('../models/DislikedJob')

// POST /api/applications/dislike/:jobId
exports.dislikeJob = async (req, res) => {
  try {
    await DislikedJob.findOneAndUpdate(
      { user: req.user.id, job: req.params.jobId },
      { user: req.user.id, job: req.params.jobId },
      { upsert: true, new: true }
    )
    res.json({ disliked: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// DELETE /api/applications/dislike/:jobId — undo dislike
exports.undislikeJob = async (req, res) => {
  try {
    await DislikedJob.findOneAndDelete({ user: req.user.id, job: req.params.jobId })
    res.json({ disliked: false })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/applications/disliked-ids
exports.getDislikedJobIds = async (req, res) => {
  try {
    const docs = await DislikedJob.find({ user: req.user.id }).select('job')
    res.json(docs.map(d => d.job.toString()))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
