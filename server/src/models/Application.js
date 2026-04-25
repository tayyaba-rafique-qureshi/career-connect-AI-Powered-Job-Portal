const mongoose = require('mongoose')

const applicationSchema = new mongoose.Schema({
  job:        { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  applicant:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  resumeText: { type: String, required: true },
  aiScore:    { type: Number, default: null },   // similarity score from AI service
  status:     { type: String, enum: ['pending', 'reviewed', 'accepted', 'rejected'], default: 'pending' }
}, { timestamps: true })

module.exports = mongoose.model('Application', applicationSchema)
