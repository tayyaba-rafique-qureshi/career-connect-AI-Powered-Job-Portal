const Application = require('../models/Application')
const Job = require('../models/Job')
const User = require('../models/User')
const aiService = require('../services/aiService')
const {
  sendApplicationConfirmEmail,
  sendNewApplicationEmail,
  sendStatusUpdateEmail
} = require('../services/emailService')

exports.applyToJob = async (req, res) => {
  try {
    const { resumeText } = req.body
    const job = await Job.findById(req.params.jobId)
    if (!job) return res.status(404).json({ message: 'Job not found' })

    const aiScore = await aiService.analyzeMatch(resumeText, job.description)

    const application = await Application.create({
      job: job._id,
      applicant: req.user.id,
      resumeText,
      aiScore
    })

    // Notify applicant
    const applicant = await User.findById(req.user.id)
    sendApplicationConfirmEmail({ applicant, job: { ...job.toObject(), aiScore } })

    // Notify employer/recruiter who posted the job
    if (job.postedBy) {
      const employer = await User.findById(job.postedBy)
      if (employer) sendNewApplicationEmail({ employer, applicant, job: { ...job.toObject(), aiScore } })
    }

    res.status(201).json(application)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getMyApplications = async (req, res) => {
  try {
    const apps = await Application.find({ applicant: req.user.id }).populate('job')
    res.json(apps)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// PATCH /api/applications/:id/status  — recruiter updates status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body
    const validStatuses = ['pending', 'reviewed', 'accepted', 'rejected']
    if (!validStatuses.includes(status))
      return res.status(400).json({ message: 'Invalid status' })

    const application = await Application.findById(req.params.id)
      .populate('applicant', 'name email')
      .populate('job', 'title company')

    if (!application) return res.status(404).json({ message: 'Application not found' })

    application.status = status
    await application.save()

    // Notify applicant of status change
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
