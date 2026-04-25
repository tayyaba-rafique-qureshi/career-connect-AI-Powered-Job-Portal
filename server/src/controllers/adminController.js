const User = require('../models/User')
const Job = require('../models/Job')
const Application = require('../models/Application')

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password')
    res.json(users)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find().populate('postedBy', 'name email')
    res.json(jobs)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getAllApplications = async (req, res) => {
  try {
    const apps = await Application.find()
      .populate('applicant', 'name email')
      .populate('job', 'title company')
    res.json(apps)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id)
    res.json({ message: 'User deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
