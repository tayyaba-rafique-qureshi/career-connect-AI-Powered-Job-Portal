const Application = require('../models/Application')
const Job = require('../models/Job')
const User = require('../models/User')
const aiService = require('../services/aiService')
const {
  sendApplicationConfirmEmail,
  sendNewApplicationEmail,
  sendStatusUpdateEmail
} = require('../services/emailService')

// POST /api/applications/:jobId — applicant applies to a job
exports.applyToJob = async (req, res) => {
  try {
    const { resumeText } = req.body
    const job = await Job.findById(req.params.jobId)
    if (!job) return res.status(404).json({ message: 'Job not found' })

    // Prevent duplicate applications
    const existing = await Application.findOne({ job: job._id, applicant: req.user.id })
    if (existing) return res.status(400).json({ message: 'Already applied to this job' })

    const aiScore = await aiService.analyzeMatch(resumeText || '', job.description)

    const application = await Application.create({
      job: job._id,
      applicant: req.user.id,
      resumeText: resumeText || '',
      aiScore
    })

    const applicant = await User.findById(req.user.id)
    sendApplicationConfirmEmail({ applicant, job: { ...job.toObject(), aiScore } })

    if (job.postedBy) {
      const employer = await User.findById(job.postedBy)
      if (employer) sendNewApplicationEmail({ employer, applicant, job: { ...job.toObject(), aiScore } })
    }

    res.status(201).json(application)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/applications/me — applicant's own applications
exports.getMyApplications = async (req, res) => {
  try {
    const apps = await Application.find({ applicant: req.user.id })
      .populate('job')
      .sort({ createdAt: -1 })
    res.json(apps)
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

    application.status = status
    await application.save()

    sendStatusUpdateEmail({
      applicant: application.applicant,
      job: application.job,
      status
    })

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

    if (!application) return res.status(404).json({ message: 'Application not found' })

    if (application.job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    application.interview = { date, time, type, meetingLink, address, notes, scheduledAt: new Date() }
    application.status = 'shortlisted'
    await application.save()

    res.json(application)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
