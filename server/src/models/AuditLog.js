const mongoose = require('mongoose')

const auditLogSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  targetType: { type: String, enum: ['user', 'job', 'application', 'setting', 'announcement'], required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId },
  details: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
})

auditLogSchema.index({ createdAt: -1 })
auditLogSchema.index({ adminId: 1 })
auditLogSchema.index({ targetType: 1 })

module.exports = mongoose.model('AuditLog', auditLogSchema)
