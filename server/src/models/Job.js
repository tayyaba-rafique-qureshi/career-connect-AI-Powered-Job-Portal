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
  status:          { type: String, enum: ['active', 'draft', 'closed'], default: 'draft' },
  postedBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  views:           { type: Number, default: 0 },
  // Admin fields
  isFeatured:  { type: Boolean, default: false },
  isFlagged:   { type: Boolean, default: false },
  flagReason:  { type: String },
  flaggedAt:   { type: Date },
  flaggedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deletedAt:   { type: Date },
  adminReports: [{
    reportedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    category:    { type: String, enum: ['spam', 'misleading', 'inappropriate', 'duplicate', 'fake_company', 'salary_fraud', 'other'] },
    notes:       { type: String },
    severity:    { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    status:      { type: String, enum: ['open', 'resolved', 'dismissed'], default: 'open' },
    reportedAt:  { type: Date, default: Date.now },
    resolvedAt:  { type: Date },
    resolvedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolution:  { type: String }
  }]
}, { timestamps: true })

module.exports = mongoose.model('Job', jobSchema)
