const mongoose = require('mongoose')

const companyReviewSchema = new mongoose.Schema({
  companyName:    { type: String, required: true, index: true },
  reviewer:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rating:         { type: Number, required: true, min: 1, max: 5 },
  title:          { type: String, required: true },
  body:           { type: String },
  pros:           { type: String },
  cons:           { type: String },
  role:           { type: String, default: 'Employee' },
  employmentType: { type: String, enum: ['Full-time', 'Part-time', 'Contract', 'Intern'], default: 'Full-time' },
  recommended:    { type: Boolean, default: false },
  // Sub-ratings
  workLifeBalance: { type: Number, min: 1, max: 5 },
  compensation:    { type: Number, min: 1, max: 5 },
  jobSecurity:     { type: Number, min: 1, max: 5 },
  management:      { type: Number, min: 1, max: 5 },
  culture:         { type: Number, min: 1, max: 5 },
}, { timestamps: true })

module.exports = mongoose.model('CompanyReview', companyReviewSchema)
