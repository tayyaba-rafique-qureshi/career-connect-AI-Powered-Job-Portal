const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')
const {
  getDashboardStats,
  getAllUsers,
  getUserById,
  updateUserRole,
  toggleUserBan,
  deleteUser,
  impersonateUser,
  getAllJobsAdmin,
  updateJobStatus,
  toggleFeatureJob,
  deleteJob,
  getAllApplicationsAdmin,
  updateApplicationStatus,
  getAnalytics,
  getSystemSettings,
  updateSystemSettings,
  sendPlatformAnnouncement,
  getAuditLogs
} = require('../controllers/adminController')

// All routes require admin authentication
router.use(protect, requireRole('admin'))

// Dashboard
router.get('/dashboard/stats', getDashboardStats)

// Analytics
router.get('/analytics', getAnalytics)

// User Management
router.get('/users', getAllUsers)
router.get('/users/:id', getUserById)
router.patch('/users/:id/role', updateUserRole)
router.patch('/users/:id/ban', toggleUserBan)
router.delete('/users/:id', deleteUser)
router.post('/users/:id/impersonate', impersonateUser)

// Job Management
router.get('/jobs', getAllJobsAdmin)
router.patch('/jobs/:id/status', updateJobStatus)
router.patch('/jobs/:id/feature', toggleFeatureJob)
router.delete('/jobs/:id', deleteJob)

// Application Management
router.get('/applications', getAllApplicationsAdmin)
router.patch('/applications/:id/status', updateApplicationStatus)

// Settings
router.get('/settings', getSystemSettings)
router.patch('/settings', updateSystemSettings)

// Announcements
router.post('/announcements', sendPlatformAnnouncement)

// Audit Logs
router.get('/audit-logs', getAuditLogs)

module.exports = router
