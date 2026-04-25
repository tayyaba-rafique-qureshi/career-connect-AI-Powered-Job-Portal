const Job = require('../models/Job')

exports.getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find().populate('postedBy', 'name email')
    res.json(jobs)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.createJob = async (req, res) => {
  try {
    const job = await Job.create({ ...req.body, postedBy: req.user.id })
    res.status(201).json(job)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
    if (!job) return res.status(404).json({ message: 'Job not found' })
    res.json(job)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
