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
  getAuditLogs,
  reportJob,
  getJobReports,
  resolveJobReport,
  getAllJobReports,
  getVerificationRequests,
  reviewVerification,
  requestVerification,
  getActiveBanners,
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBanner,
  bulkUpdateUsers,
  bulkUpdateJobs,
  getEntityNotes,
  createNote,
  updateNote,
  deleteNote,
  getPlatformHealth,
  globalSearch,
  getDashboardWidgets,
  updateDashboardWidgets
} = require('../controllers/adminController')

// All routes require admin authentication
router.use(protect, requireRole('admin'))

// Dashboard
router.get('/dashboard/stats', getDashboardStats)
router.get('/dashboard/widgets', getDashboardWidgets)
router.patch('/dashboard/widgets', updateDashboardWidgets)

// Analytics
router.get('/analytics', getAnalytics)

// Global Search
router.get('/search', globalSearch)

// User Management
router.get('/users', getAllUsers)
router.get('/users/:id', getUserById)
router.patch('/users/:id/role', updateUserRole)
router.patch('/users/:id/ban', toggleUserBan)
router.delete('/users/:id', deleteUser)
router.post('/users/:id/impersonate', impersonateUser)
router.patch('/users/bulk', bulkUpdateUsers)

// Job Management
router.get('/jobs', getAllJobsAdmin)
router.patch('/jobs/:id/status', updateJobStatus)
router.patch('/jobs/:id/feature', toggleFeatureJob)
router.delete('/jobs/:id', deleteJob)
router.post('/jobs/:id/report', reportJob)
router.get('/jobs/:id/reports', getJobReports)
router.patch('/jobs/:jobId/reports/:reportId/resolve', resolveJobReport)
router.patch('/jobs/bulk', bulkUpdateJobs)

// Job Reports
router.get('/job-reports', getAllJobReports)

// Application Management
router.get('/applications', getAllApplicationsAdmin)
router.patch('/applications/:id/status', updateApplicationStatus)

// Employer Verification
router.get('/verifications', getVerificationRequests)
router.patch('/verifications/:id/review', reviewVerification)
router.post('/verifications/request', requestVerification)

// Announcement Banners
router.get('/banners/active', getActiveBanners)
router.get('/banners', getAllBanners)
router.post('/banners', createBanner)
router.patch('/banners/:id', updateBanner)
router.delete('/banners/:id', deleteBanner)
router.patch('/banners/:id/toggle', toggleBanner)

// Admin Notes
router.get('/notes/:entityType/:entityId', getEntityNotes)
router.post('/notes', createNote)
router.patch('/notes/:id', updateNote)
router.delete('/notes/:id', deleteNote)

// Platform Health
router.get('/health', getPlatformHealth)

// Settings
router.get('/settings', getSystemSettings)
router.patch('/settings', updateSystemSettings)

// Announcements
router.post('/announcements', sendPlatformAnnouncement)

// Audit Logs
router.get('/audit-logs', getAuditLogs)

module.exports = router
