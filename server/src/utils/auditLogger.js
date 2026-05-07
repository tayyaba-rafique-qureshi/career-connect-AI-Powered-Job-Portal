const AuditLog = require('../models/AuditLog')

/**
 * Log an admin action to the audit trail
 * @param {String} adminId - MongoDB ObjectId of the admin user
 * @param {String} action - Action performed (e.g., 'USER_BANNED', 'JOB_DELETED')
 * @param {String} targetType - Type of target entity ('user', 'job', 'application', 'setting', 'announcement')
 * @param {String} targetId - MongoDB ObjectId of the target entity
 * @param {Object} details - Additional details about the action
 */
const logAdminAction = async (adminId, action, targetType, targetId, details = {}) => {
  try {
    await AuditLog.create({
      adminId,
      action,
      targetType,
      targetId,
      details
    })
  } catch (error) {
    console.error('Failed to log admin action:', error.message)
  }
}

module.exports = { logAdminAction }
