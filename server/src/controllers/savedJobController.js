const SavedJob = require('../models/SavedJob')
const Job = require('../models/Job')

// POST /api/saved-jobs/:jobId — save a job
exports.saveJob = async (req, res) => {
  try {
    const existing = await SavedJob.findOne({ user: req.user.id, job: req.params.jobId })
    if (existing) return res.status(400).json({ message: 'Already saved' })
    const saved = await SavedJob.create({ user: req.user.id, job: req.params.jobId })
    res.status(201).json(saved)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// DELETE /api/saved-jobs/:jobId — unsave a job
exports.unsaveJob = async (req, res) => {
  try {
    await SavedJob.findOneAndDelete({ user: req.user.id, job: req.params.jobId })
    res.json({ message: 'Removed' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/saved-jobs — get all saved jobs for current user
exports.getSavedJobs = async (req, res) => {
  try {
    const saved = await SavedJob.find({ user: req.user.id })
      .populate('job')
      .sort({ createdAt: -1 })
    res.json(saved)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/saved-jobs/ids — just the jobIds (for quick bookmark state check)
exports.getSavedJobIds = async (req, res) => {
  try {
    const saved = await SavedJob.find({ user: req.user.id }).select('job')
    res.json(saved.map(s => s.job.toString()))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
