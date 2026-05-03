const mongoose = require('mongoose')

const interviewSchema = new mongoose.Schema({
  date:        { type: String },
  time:        { type: String },
  type:        { type: String, enum: ['in-person', 'virtual'], default: 'virtual' },
  meetingLink: { type: String },
  address:     { type: String },
  notes:       { type: String },
  scheduledAt: { type: Date, default: Date.now }
}, { _id: false })

const applicationSchema = new mongoose.Schema({
  job:        { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  applicant:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  resumeText: { type: String, default: '' },
  aiScore:    { type: Number, default: null },
  status:     {
    type: String,
    enum: ['pending', 'reviewed', 'shortlisted', 'rejected', 'accepted'],
    default: 'pending'
  },
  interview:  { type: interviewSchema, default: null }
}, { timestamps: true })

module.exports = mongoose.model('Application', applicationSchema)
