const mongoose = require('mongoose')

const jobSchema = new mongoose.Schema({
  title:           { type: String, required: true },
  company:         { type: String, required: true },
  description:     { type: String, required: true },
  location:        { type: String, default: 'Remote' },
  requiredSkills:  [{ type: String }],
  // legacy field kept for backward compat
  skills:          [{ type: String }],
  experienceLevel: { type: String, enum: ['entry', 'mid', 'senior', 'lead', 'any'], default: 'any' },
  jobType:         [{ type: String, enum: ['full-time', 'part-time', 'contract', 'internship'] }],
  workMode:        { type: String, enum: ['remote', 'on-site', 'hybrid'], default: 'remote' },
  salaryMin:       { type: Number, default: null },
  salaryMax:       { type: Number, default: null },
  salaryType:      { type: String, enum: ['yearly', 'monthly', 'stipend'], default: 'yearly' },
  status:          { type: String, enum: ['active', 'draft', 'closed'], default: 'draft' },
  postedBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  views:           { type: Number, default: 0 }
}, { timestamps: true })

// Text index for full-text search (GET /api/jobs/search)
jobSchema.index({ title: 'text', description: 'text' })

module.exports = mongoose.model('Job', jobSchema)
