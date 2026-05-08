import api from './api'

// Dashboard
export const getDashboardStats = () => api.get('/admin/dashboard/stats')
export const getDashboardWidgets = () => api.get('/admin/dashboard/widgets')
export const updateDashboardWidgets = (widgets) => api.patch('/admin/dashboard/widgets', { widgets })

// Analytics
export const getAnalytics = (params) => api.get('/admin/analytics', { params })

// Global Search
export const globalSearch = (query) => api.get('/admin/search', { params: { q: query } })

// User Management
export const getUsers = (params) => api.get('/admin/users', { params })
export const getUserById = (id) => api.get(`/admin/users/${id}`)
export const updateUserRole = (id, role) => api.patch(`/admin/users/${id}/role`, { role })
export const toggleUserBan = (id, reason) => api.patch(`/admin/users/${id}/ban`, { reason })
export const deleteUser = (id) => api.delete(`/admin/users/${id}`)
export const impersonateUser = (id) => api.post(`/admin/users/${id}/impersonate`)
export const bulkUpdateUsers = (userIds, action, value) => api.patch('/admin/users/bulk', { userIds, action, value })

// Job Management
export const getJobs = (params) => api.get('/admin/jobs', { params })
export const updateJobStatus = (id, status) => api.patch(`/admin/jobs/${id}/status`, { status })
export const toggleFeatureJob = (id) => api.patch(`/admin/jobs/${id}/feature`)
export const deleteJob = (id) => api.delete(`/admin/jobs/${id}`)
export const reportJob = (id, data) => api.post(`/admin/jobs/${id}/report`, data)
export const getJobReports = (id) => api.get(`/admin/jobs/${id}/reports`)
export const bulkUpdateJobs = (jobIds, action, value) => api.patch('/admin/jobs/bulk', { jobIds, action, value })

// Job Reports
export const getAllJobReports = (params) => api.get('/admin/job-reports', { params })
export const resolveJobReport = (jobId, reportId, data) => api.patch(`/admin/jobs/${jobId}/reports/${reportId}/resolve`, data)

// Application Management
export const getApplications = (params) => api.get('/admin/applications', { params })
export const updateApplicationStatus = (id, status) => api.patch(`/admin/applications/${id}/status`, { status })

// Employer Verification
export const getVerifications = (params) => api.get('/admin/verifications', { params })
export const reviewVerification = (id, action, rejectedReason) => api.patch(`/admin/verifications/${id}/review`, { action, rejectedReason })
export const requestVerification = (data) => api.post('/admin/verifications/request', data)

// Announcement Banners
export const getActiveBanners = () => api.get('/admin/banners/active')
export const getBanners = (params) => api.get('/admin/banners', { params })
export const createBanner = (data) => api.post('/admin/banners', data)
export const updateBanner = (id, data) => api.patch(`/admin/banners/${id}`, data)
export const deleteBanner = (id) => api.delete(`/admin/banners/${id}`)
export const toggleBanner = (id) => api.patch(`/admin/banners/${id}/toggle`)

// Admin Notes
export const getEntityNotes = (entityType, entityId) => api.get(`/admin/notes/${entityType}/${entityId}`)
export const createNote = (data) => api.post('/admin/notes', data)
export const updateNote = (id, data) => api.patch(`/admin/notes/${id}`, data)
export const deleteNote = (id) => api.delete(`/admin/notes/${id}`)

// Platform Health
export const getPlatformHealth = () => api.get('/admin/health')

// Settings
export const getSettings = () => api.get('/admin/settings')
export const updateSettings = (data) => api.patch('/admin/settings', data)

// Announcements
export const sendAnnouncement = (data) => api.post('/admin/announcements', data)

// Audit Logs
export const getAuditLogs = (params) => api.get('/admin/audit-logs', { params })
