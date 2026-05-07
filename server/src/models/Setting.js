const mongoose = require('mongoose')

const settingSchema = new mongoose.Schema({
  key: { type: String, default: 'platform_settings', unique: true },
  allowRegistration: { type: Boolean, default: true },
  maintenanceMode: { type: Boolean, default: false },
  featuredJobsLimit: { type: Number, default: 10 },
  maxApplicationsPerUser: { type: Number, default: 50 },
  aiMatchThreshold: { type: Number, default: 40 },
  maxJobsPerEmployer: { type: Number, default: 100 },
  jobExpiryDays: { type: Number, default: 90 },
  enableEmailNotifications: { type: Boolean, default: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dashboardWidgets: {
    type: [String],
    default: ['users', 'jobs', 'applications', 'pendingReviews', 'recentActivity', 'jobStatusChart', 'applicationFunnel', 'topEmployers']
  }
}, { timestamps: true })

module.exports = mongoose.model('Setting', settingSchema)
