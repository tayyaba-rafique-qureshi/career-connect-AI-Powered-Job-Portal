import api from './api'

// Dashboard
export const getDashboardStats = () => api.get('/admin/dashboard/stats')

// Analytics
export const getAnalytics = (params) => api.get('/admin/analytics', { params })

// User Management
export const getUsers = (params) => api.get('/admin/users', { params })
export const getUserById = (id) => api.get(`/admin/users/${id}`)
export const updateUserRole = (id, role) => api.patch(`/admin/users/${id}/role`, { role })
export const toggleUserBan = (id, reason) => api.patch(`/admin/users/${id}/ban`, { reason })
export const deleteUser = (id) => api.delete(`/admin/users/${id}`)
export const impersonateUser = (id) => api.post(`/admin/users/${id}/impersonate`)

// Job Management
export const getJobs = (params) => api.get('/admin/jobs', { params })
export const updateJobStatus = (id, status) => api.patch(`/admin/jobs/${id}/status`, { status })
export const toggleFeatureJob = (id) => api.patch(`/admin/jobs/${id}/feature`)
export const deleteJob = (id) => api.delete(`/admin/jobs/${id}`)

// Application Management
export const getApplications = (params) => api.get('/admin/applications', { params })
export const updateApplicationStatus = (id, status) => api.patch(`/admin/applications/${id}/status`, { status })

// Settings
export const getSettings = () => api.get('/admin/settings')
export const updateSettings = (data) => api.patch('/admin/settings', data)

// Announcements
export const sendAnnouncement = (data) => api.post('/admin/announcements', data)

// Audit Logs
export const getAuditLogs = (params) => api.get('/admin/audit-logs', { params })
