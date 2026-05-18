const User = require('../models/User')
const Job = require('../models/Job')
const Application = require('../models/Application')
const Setting = require('../models/Setting')
const AuditLog = require('../models/AuditLog')
const AnnouncementBanner = require('../models/AnnouncementBanner')
const AdminNote = require('../models/AdminNote')
const Notification = require('../models/Notification')
const { logAdminAction } = require('../utils/auditLogger')
const { sendEmail, sendStatusUpdateEmail } = require('../services/emailService')
const jwt = require('jsonwebtoken')
const os = require('os')
const mongoose = require('mongoose')
const { isValidObjectId } = require('mongoose')

// Helper to validate MongoDB ObjectId
const validateId = (id, res) => {
  if (!isValidObjectId(id)) {
    res.status(400).json({ success: false, message: 'Invalid ID format' })
    return false
  }
  return true
}

// ==================== DASHBOARD ====================

/**
 * GET /api/admin/dashboard/stats
 * Get dashboard statistics
 */
const getDashboardStats = async (req, res) => {
  try {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Total counts
    const totalUsers = await User.countDocuments()
    const totalJobs = await Job.countDocuments({ deletedAt: null })
    const totalApplications = await Application.countDocuments()

    // Users by role
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ])

    // Jobs by status
    const jobsByStatus = await Job.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])

    // Applications by status
    const applicationsByStatus = await Application.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])

    // New signups last 7 days
    const newSignups = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    })

    // New jobs last 7 days
    const newJobs = await Job.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
      deletedAt: null
    })

    // New applications last 7 days
    const newApplications = await Application.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    })

    // Pending verification requests count
    const pendingVerifications = await User.countDocuments({
      role: { $in: ['employer', 'recruiter'] },
      verificationStatus: 'pending'
    })

    // Top 5 companies by job count
    const topCompanies = await Job.aggregate([
      { $match: { deletedAt: null, status: 'active' } },
      { $group: { _id: '$company', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ])

    // Top 5 most-applied-to jobs
    const topJobs = await Application.aggregate([
      { $group: { _id: '$job', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'jobs',
          localField: '_id',
          foreignField: '_id',
          as: 'jobDetails'
        }
      },
      { $unwind: '$jobDetails' },
      {
        $project: {
          title: '$jobDetails.title',
          company: '$jobDetails.company',
          applicationCount: '$count'
        }
      }
    ])

    // Flagged jobs count
    const flaggedJobs = await Job.countDocuments({
      isFlagged: true,
      deletedAt: null
    })

    // Open reports count
    const openReports = await Job.aggregate([
      { $unwind: '$adminReports' },
      { $match: { 'adminReports.status': 'open' } },
      { $count: 'count' }
    ])

    res.json({
      success: true,
      data: {
        totalUsers,
        totalJobs,
        totalApplications,
        usersByRole: usersByRole.reduce((acc, item) => {
          acc[item._id] = item.count
          return acc
        }, {}),
        jobsByStatus: jobsByStatus.reduce((acc, item) => {
          acc[item._id] = item.count
          return acc
        }, {}),
        applicationsByStatus: applicationsByStatus.reduce((acc, item) => {
          acc[item._id] = item.count
          return acc
        }, {}),
        newSignups,
        newJobs,
        newApplications,
        pendingVerifications,
        flaggedJobs,
        openReports: openReports[0]?.count || 0,
        topCompanies: topCompanies.map(c => ({ company: c._id, jobCount: c.count })),
        topJobs
      }
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// ==================== USER MANAGEMENT ====================

/**
 * GET /api/admin/users
 * Get all users with pagination and filters
 */
const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      role,
      onboardingComplete,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    console.log('getAllUsers called with query params:', req.query)

    const query = {}
    if (role) query.role = role
    if (onboardingComplete !== undefined && onboardingComplete !== '') {
      query.onboardingComplete = onboardingComplete === 'true'
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }

    console.log('MongoDB query:', JSON.stringify(query))

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

    const users = await User.find(query)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('bannedBy', 'name email')

    const total = await User.countDocuments(query)

    console.log(`Found ${total} total users, returning ${users.length} users for page ${page}`)

    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * GET /api/admin/users/:id
 * Get user by ID
 */
const getUserById = async (req, res) => {
  try {
    if (!validateId(req.params.id, res)) return

    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('bannedBy', 'name email')

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    res.json({ success: true, data: user })
  } catch (error) {
    console.error('Error fetching user:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * PATCH /api/admin/users/:id/role
 * Update user role
 */
const updateUserRole = async (req, res) => {
  try {
    if (!validateId(req.params.id, res)) return

    const { role } = req.body
    const validRoles = ['applicant', 'recruiter', 'employer', 'admin']

    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be one of: ' + validRoles.join(', ')
      })
    }

    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const oldRole = user.role
    user.role = role
    await user.save()

    await logAdminAction(
      req.user.id,
      'USER_ROLE_UPDATED',
      'user',
      user._id,
      { oldRole, newRole: role }
    )

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: user
    })
  } catch (error) {
    console.error('Error updating user role:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * PATCH /api/admin/users/:id/ban
 * Ban or unban a user
 */
const toggleUserBan = async (req, res) => {
  try {
    if (!validateId(req.params.id, res)) return

    const { reason } = req.body
    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    // Prevent admin from banning themselves
    if (user._id.toString() === req.user.id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot perform this action on your own account' })
    }

    if (user.isBanned) {
      // Unban user
      user.isBanned = false
      user.banReason = undefined
      user.bannedAt = undefined
      user.bannedBy = undefined
      await user.save()

      await logAdminAction(
        req.user.id,
        'USER_UNBANNED',
        'user',
        user._id,
        { userName: user.name, userEmail: user.email }
      )

      res.json({
        success: true,
        message: 'User unbanned successfully',
        data: user
      })
    } else {
      // Ban user
      if (!reason) {
        return res.status(400).json({
          success: false,
          message: 'Ban reason is required'
        })
      }

      user.isBanned = true
      user.banReason = reason
      user.bannedAt = new Date()
      user.bannedBy = req.user.id
      await user.save()

      await logAdminAction(
        req.user.id,
        'USER_BANNED',
        'user',
        user._id,
        { userName: user.name, userEmail: user.email, reason }
      )

      res.json({
        success: true,
        message: 'User banned successfully',
        data: user
      })
    }
  } catch (error) {
    console.error('Error toggling user ban:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * DELETE /api/admin/users/:id
 * Delete a user
 */
const deleteUser = async (req, res) => {
  try {
    if (!validateId(req.params.id, res)) return

    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user.id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot perform this action on your own account' })
    }

    // Prevent deleting the last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' })
      if (adminCount <= 1) {
        return res.status(400).json({ success: false, message: 'Cannot delete the last admin account' })
      }
    }

    // Delete user's jobs
    await Job.deleteMany({ postedBy: user._id })

    // Delete user's applications
    await Application.deleteMany({ applicant: user._id })

    // Delete the user
    await User.findByIdAndDelete(req.params.id)

    await logAdminAction(
      req.user.id,
      'USER_DELETED',
      'user',
      user._id,
      { userName: user.name, userEmail: user.email }
    )

    res.json({
      success: true,
      message: 'User and associated data deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * POST /api/admin/users/:id/impersonate
 * Generate impersonation token
 */
const impersonateUser = async (req, res) => {
  try {
    if (!validateId(req.params.id, res)) return

    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    // Generate short-lived token (15 minutes)
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        isImpersonation: true
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    )

    await logAdminAction(
      req.user.id,
      'USER_IMPERSONATED',
      'user',
      user._id,
      { userName: user.name, userEmail: user.email }
    )

    res.json({
      success: true,
      message: 'Impersonation token generated (valid for 15 minutes)',
      data: { token, user: { id: user._id, name: user.name, email: user.email, role: user.role } }
    })
  } catch (error) {
    console.error('Error generating impersonation token:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// ==================== JOB MANAGEMENT ====================

/**
 * GET /api/admin/jobs
 * Get all jobs with pagination and filters
 */
const getAllJobsAdmin = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      workMode,
      experienceLevel,
      isFeatured,
<<<<<<< HEAD
      jobId,
=======
>>>>>>> f9873058d0e7eb905fe9fba20468adc7056e7fa3
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    const query = { deletedAt: null }
    if (status) query.status = status
    if (workMode) query.workMode = workMode
    if (experienceLevel) query.experienceLevel = experienceLevel
    if (isFeatured !== undefined && isFeatured !== '') {
      query.isFeatured = isFeatured === 'true'
    }
<<<<<<< HEAD
    if (jobId && isValidObjectId(jobId)) {
      query._id = jobId
    }
=======
>>>>>>> f9873058d0e7eb905fe9fba20468adc7056e7fa3
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ]
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

    const jobs = await Job.find(query)
      .populate('postedBy', 'name email')
      .populate('flaggedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Job.countDocuments(query)

    res.json({
      success: true,
      data: jobs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Error fetching jobs:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * PATCH /api/admin/jobs/:id/status
 * Update job status
 */
const updateJobStatus = async (req, res) => {
  try {
    if (!validateId(req.params.id, res)) return

    const { status } = req.body
    const validStatuses = ['active', 'draft', 'closed']

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      })
    }

    const job = await Job.findById(req.params.id)
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' })
    }

    const oldStatus = job.status
    job.status = status
    await job.save()

    await logAdminAction(
      req.user.id,
      'JOB_STATUS_UPDATED',
      'job',
      job._id,
      { jobTitle: job.title, oldStatus, newStatus: status }
    )

    res.json({
      success: true,
      message: 'Job status updated successfully',
      data: job
    })
  } catch (error) {
    console.error('Error updating job status:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * PATCH /api/admin/jobs/:id/feature
 * Toggle job featured status
 */
const toggleFeatureJob = async (req, res) => {
  try {
    if (!validateId(req.params.id, res)) return

    const job = await Job.findById(req.params.id)
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' })
    }

    job.isFeatured = !job.isFeatured
    await job.save()

    await logAdminAction(
      req.user.id,
      job.isFeatured ? 'JOB_FEATURED' : 'JOB_UNFEATURED',
      'job',
      job._id,
      { jobTitle: job.title, company: job.company }
    )

    res.json({
      success: true,
      message: `Job ${job.isFeatured ? 'featured' : 'unfeatured'} successfully`,
      data: job
    })
  } catch (error) {
    console.error('Error toggling job feature:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * DELETE /api/admin/jobs/:id
 * Delete a job
 */
const deleteJob = async (req, res) => {
  try {
    if (!validateId(req.params.id, res)) return

    const job = await Job.findById(req.params.id)
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' })
    }

    // Delete associated applications
    await Application.deleteMany({ job: job._id })

    // Delete the job
    await Job.findByIdAndDelete(req.params.id)

    await logAdminAction(
      req.user.id,
      'JOB_DELETED',
      'job',
      job._id,
      { jobTitle: job.title, company: job.company }
    )

    res.json({
      success: true,
      message: 'Job and associated applications deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting job:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// ==================== APPLICATION MANAGEMENT ====================

/**
 * GET /api/admin/applications
 * Get all applications with pagination and filters
 */
const getAllApplicationsAdmin = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    const query = {}
    if (status) query.status = status

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

    let applications = await Application.find(query)
      .populate('applicant', 'name email avatar')
      .populate('job', 'title company location status')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))

    // Filter out orphaned records (job or applicant was deleted)
    let valid = applications.filter(a => a.applicant && a.job)

    // Apply search filter after population (search in applicant name/email or job title/company)
    if (search && search.trim()) {
      const searchLower = search.toLowerCase().trim()
      valid = valid.filter(app => {
        const applicantName = app.applicant?.name?.toLowerCase() || ''
        const applicantEmail = app.applicant?.email?.toLowerCase() || ''
        const jobTitle = app.job?.title?.toLowerCase() || ''
        const jobCompany = app.job?.company?.toLowerCase() || ''
        
        return applicantName.includes(searchLower) ||
               applicantEmail.includes(searchLower) ||
               jobTitle.includes(searchLower) ||
               jobCompany.includes(searchLower)
      })
    }

    // Count total valid applications (excluding orphaned records)
    const allApplications = await Application.find(query)
      .populate('applicant', 'name email')
      .populate('job', 'title company')
    
    let totalValid = allApplications.filter(a => a.applicant && a.job)
    
    // Apply search to total count as well
    if (search && search.trim()) {
      const searchLower = search.toLowerCase().trim()
      totalValid = totalValid.filter(app => {
        const applicantName = app.applicant?.name?.toLowerCase() || ''
        const applicantEmail = app.applicant?.email?.toLowerCase() || ''
        const jobTitle = app.job?.title?.toLowerCase() || ''
        const jobCompany = app.job?.company?.toLowerCase() || ''
        
        return applicantName.includes(searchLower) ||
               applicantEmail.includes(searchLower) ||
               jobTitle.includes(searchLower) ||
               jobCompany.includes(searchLower)
      })
    }

    const total = totalValid.length

    res.json({
      success: true,
      data: valid,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Error fetching applications:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * PATCH /api/admin/applications/:id/status
 * Update application status
 */
const updateApplicationStatus = async (req, res) => {
  try {
    if (!validateId(req.params.id, res)) return

    const { status } = req.body
    const validStatuses = ['pending', 'reviewed', 'shortlisted', 'rejected', 'accepted', 'archived']

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      })
    }

    const application = await Application.findById(req.params.id)

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' })
    }

    const oldStatus = application.status
    application.status = status
    await application.save()

    // Populate after saving to return full data
    await application.populate('applicant', 'name email')
    await application.populate('job', 'title company')

    if (oldStatus !== status) {
      sendStatusUpdateEmail({
        applicant: application.applicant,
        job: application.job,
        status
      })

      await Notification.create({
        user: application.applicant._id,
        type: 'status_update',
        title: 'Application update',
        message: `${application.job.title} at ${application.job.company}: ${status}`,
        link: '/my-jobs?tab=applied',
      }).catch(() => {})
    }

    await logAdminAction(
      req.user.id,
      'APPLICATION_STATUS_UPDATED',
      'application',
      application._id,
      {
        applicantName: application.applicant?.name,
        jobTitle: application.job?.title,
        oldStatus,
        newStatus: status
      }
    )

    res.json({
      success: true,
      message: 'Application status updated successfully',
      data: application
    })
  } catch (error) {
    console.error('Error updating application status:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// ==================== ANALYTICS ====================

/**
 * GET /api/admin/analytics
 * Get platform analytics
 */
const getAnalytics = async (req, res) => {
  try {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Signups per day (last 30 days)
    const signupsPerDay = await User.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])

    // Jobs posted per day (last 30 days)
    const jobsPerDay = await Job.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo }, deletedAt: null } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])

    // Applications per day (last 30 days)
    const applicationsPerDay = await Application.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])

    // Role distribution
    const roleDistribution = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ])

    // Job status distribution
    const jobStatusDistribution = await Job.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])

    // Application status distribution
    const applicationStatusDistribution = await Application.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])

    // Top hiring companies
    const topCompanies = await Job.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: '$company', jobCount: { $sum: 1 } } },
      { $sort: { jobCount: -1 } },
      { $limit: 10 }
    ])

    res.json({
      success: true,
      data: {
        signupsPerDay: signupsPerDay.map(d => ({ date: d._id, count: d.count })),
        jobsPerDay: jobsPerDay.map(d => ({ date: d._id, count: d.count })),
        applicationsPerDay: applicationsPerDay.map(d => ({ date: d._id, count: d.count })),
        roleDistribution: roleDistribution.map(r => ({ role: r._id, count: r.count })),
        jobStatusDistribution: jobStatusDistribution.map(j => ({ status: j._id, count: j.count })),
        applicationStatusDistribution: applicationStatusDistribution.map(a => ({ status: a._id, count: a.count })),
        topCompanies: topCompanies.map(c => ({ company: c._id, jobCount: c.jobCount }))
      }
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// ==================== SETTINGS ====================

/**
 * GET /api/admin/settings
 * Get platform settings
 */
const getSystemSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne({ key: 'platform_settings' })

    if (!settings) {
      // Create default settings if none exist
      settings = await Setting.create({ key: 'platform_settings' })
    }

    res.json({ success: true, data: settings })
  } catch (error) {
    console.error('Error fetching settings:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * PATCH /api/admin/settings
 * Update platform settings
 */
const updateSystemSettings = async (req, res) => {
  try {
    const updates = req.body
    let settings = await Setting.findOne({ key: 'platform_settings' })

    if (!settings) {
      settings = await Setting.create({ key: 'platform_settings', ...updates })
    } else {
      Object.assign(settings, updates)
      settings.updatedBy = req.user.id
      await settings.save()
    }

    await logAdminAction(
      req.user.id,
      'SETTINGS_UPDATED',
      'setting',
      settings._id,
      { updates }
    )

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    })
  } catch (error) {
    console.error('Error updating settings:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * POST /api/admin/announcements
 * Send platform announcement
 */
const sendPlatformAnnouncement = async (req, res) => {
  try {
    const { subject, message, targetRole } = req.body

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Subject and message are required'
      })
    }

    // Build query for target users
    const query = {}
    if (targetRole && targetRole !== 'all') {
      query.role = targetRole
    }

    const users = await User.find(query).select('email name')

    // Send emails (in production, use a queue)
    const emailPromises = users.map(user =>
      sendEmail(user.email, subject, message).catch(err => {
        console.error(`Failed to send email to ${user.email}:`, err.message)
      })
    )

    await Promise.allSettled(emailPromises)

    await logAdminAction(
      req.user.id,
      'ANNOUNCEMENT_SENT',
      'announcement',
      null,
      { subject, targetRole: targetRole || 'all', recipientCount: users.length }
    )

    res.json({
      success: true,
      message: `Announcement sent to ${users.length} users`,
      data: { recipientCount: users.length }
    })
  } catch (error) {
    console.error('Error sending announcement:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// ==================== AUDIT LOGS ====================

/**
 * GET /api/admin/audit-logs
 * Get audit logs with pagination
 */
const getAuditLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      action,
      targetType,
      adminId,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    const query = {}
    if (action) query.action = action
    if (targetType) query.targetType = targetType
    if (adminId) query.adminId = adminId

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

    const logs = await AuditLog.find(query)
      .populate('adminId', 'name email avatar')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))

    const total = await AuditLog.countDocuments(query)

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// ==================== FEATURE 1: JOB REPORTS ====================

/**
 * POST /api/admin/jobs/:id/report
 * Report a job (admin creates formal report)
 */
const reportJob = async (req, res) => {
  try {
    if (!validateId(req.params.id, res)) return

    const { category, notes, severity } = req.body
    
    if (!category) {
      return res.status(400).json({ success: false, message: 'Category is required' })
    }

    const job = await Job.findById(req.params.id)
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' })
    }

    const report = {
      reportedBy: req.user.id,
      category,
      notes: notes || '',
      severity: severity || 'medium',
      status: 'open',
      reportedAt: new Date()
    }

    job.adminReports.push(report)
    await job.save()

    await logAdminAction(
      req.user.id,
      'JOB_REPORTED',
      'job',
      job._id,
      { jobTitle: job.title, category, severity }
    )

    res.json({
      success: true,
      message: 'Job report created successfully',
      data: job
    })
  } catch (error) {
    console.error('Error reporting job:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * GET /api/admin/jobs/:id/reports
 * Get reports for a specific job
 */
const getJobReports = async (req, res) => {
  try {
    if (!validateId(req.params.id, res)) return

    const job = await Job.findById(req.params.id)
      .populate('adminReports.reportedBy', 'name email')
      .populate('adminReports.resolvedBy', 'name email')

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' })
    }

    res.json({
      success: true,
      data: job.adminReports
    })
  } catch (error) {
    console.error('Error fetching job reports:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * PATCH /api/admin/jobs/:jobId/reports/:reportId/resolve
<<<<<<< HEAD
 * Resolve a job report (from Report collection)
 */
const resolveJobReport = async (req, res) => {
  try {
    const Report = require('../models/Report')
    const { resolution, action } = req.body
    const { reportId } = req.params

    if (!validateId(reportId, res)) return

    const report = await Report.findById(reportId).populate('job', 'title company')
=======
 * Resolve a job report
 */
const resolveJobReport = async (req, res) => {
  try {
    const { resolution, action } = req.body
    const { jobId, reportId } = req.params

    if (!validateId(jobId, res)) return

    const job = await Job.findById(jobId)
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' })
    }

    const report = job.adminReports.id(reportId)
>>>>>>> f9873058d0e7eb905fe9fba20468adc7056e7fa3
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' })
    }

<<<<<<< HEAD
    // Set status based on action
    report.status = action === 'dismiss' ? 'dismissed' : 'resolved'
    report.resolved = true
    
    console.log('[resolveJobReport] Setting status to:', report.status)
    
    // Update description with resolution notes
    if (resolution) {
      report.description = report.description 
        ? `${report.description}\n\nResolution: ${resolution}` 
        : `Resolution: ${resolution}`
    }
    
    await report.save()
    
    console.log('[resolveJobReport] Report saved with status:', report.status)
=======
    report.status = action === 'dismiss' ? 'dismissed' : 'resolved'
    report.resolution = resolution
    report.resolvedBy = req.user.id
    report.resolvedAt = new Date()

    await job.save()
>>>>>>> f9873058d0e7eb905fe9fba20468adc7056e7fa3

    await logAdminAction(
      req.user.id,
      'JOB_REPORT_RESOLVED',
<<<<<<< HEAD
      'report',
      report._id,
      { 
        jobId: report.job?._id,
        jobTitle: report.job?.title,
        action, 
        resolution 
      }
=======
      'job',
      job._id,
      { reportId, action, resolution }
>>>>>>> f9873058d0e7eb905fe9fba20468adc7056e7fa3
    )

    res.json({
      success: true,
<<<<<<< HEAD
      message: `Report ${action === 'dismiss' ? 'dismissed' : 'resolved'} successfully`,
      data: report
=======
      message: 'Report resolved successfully',
      data: job
>>>>>>> f9873058d0e7eb905fe9fba20468adc7056e7fa3
    })
  } catch (error) {
    console.error('Error resolving job report:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * GET /api/admin/job-reports
<<<<<<< HEAD
 * Get all job reports with filters (from Report collection)
 */
const getAllJobReports = async (req, res) => {
  try {
    const Report = require('../models/Report')
    const { page = 1, limit = 10, status } = req.query

    console.log('[getAllJobReports] Requested status:', status)

    // Build query - use status field directly, with fallback for old reports
    const query = {}
    if (status) {
      if (status === 'open') {
        // Open means pending or open status, OR old reports without status that aren't resolved
        query.$or = [
          { status: { $in: ['pending', 'open'] } },
          { status: { $exists: false }, resolved: { $ne: true } },
          { status: null, resolved: { $ne: true } }
        ]
      } else if (status === 'resolved') {
        // Resolved means status='resolved' OR old reports with resolved=true
        query.$or = [
          { status: 'resolved' },
          { status: { $exists: false }, resolved: true },
          { status: null, resolved: true }
        ]
      } else if (status === 'dismissed') {
        // Dismissed only matches status='dismissed' (no old equivalent)
        query.status = 'dismissed'
      } else {
        query.status = status
      }
    }

    console.log('[getAllJobReports] Query:', JSON.stringify(query))

    const skip = (parseInt(page) - 1) * parseInt(limit)

    // Get reports with populated job and user data
    const reports = await Report.find(query)
      .populate('job', 'title company location status')
      .populate('reportedBy', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    console.log('[getAllJobReports] Found reports:', reports.length)
    console.log('[getAllJobReports] Report statuses:', reports.map(r => r.status))
    
    // Log details about each report for debugging
    reports.forEach((r, idx) => {
      console.log(`[getAllJobReports] Report ${idx + 1}:`, {
        id: r._id,
        status: r.status,
        hasJob: r.job !== null,
        hasReporter: r.reportedBy !== null,
        jobId: r.job?._id,
        reporterId: r.reportedBy?._id
      })
    })

    // Filter out reports where job or reporter was deleted
    // For now, show reports even if reporter is deleted (show as "Deleted User")
    const validReports = reports.filter(r => r.job !== null)  // Only filter out deleted jobs

    console.log('[getAllJobReports] Valid reports after filtering:', validReports.length)

    // Get total count (excluding deleted jobs and reporters)
    // Use the same query logic for consistency
    const countQuery = {}
    if (status) {
      if (status === 'open') {
        countQuery.$or = [
          { status: { $in: ['pending', 'open'] } },
          { status: { $exists: false }, resolved: { $ne: true } },
          { status: null, resolved: { $ne: true } }
        ]
      } else if (status === 'resolved') {
        countQuery.$or = [
          { status: 'resolved' },
          { status: { $exists: false }, resolved: true },
          { status: null, resolved: true }
        ]
      } else if (status === 'dismissed') {
        countQuery.status = 'dismissed'
      } else {
        countQuery.status = status
      }
    }
    
    const allReports = await Report.find(countQuery)
      .populate('job', '_id')
      .populate('reportedBy', '_id')
    const totalValid = allReports.filter(r => r.job !== null).length  // Only filter deleted jobs

    // Transform to match expected format
    const transformedReports = validReports.map(report => {
      // Extract resolution from description if it exists
      let notes = report.description
      let resolution = null
      
      if (report.description && report.description.includes('\n\nResolution: ')) {
        const parts = report.description.split('\n\nResolution: ')
        notes = parts[0]
        resolution = parts[1]
      } else if (report.description && report.description.startsWith('Resolution: ')) {
        resolution = report.description.replace('Resolution: ', '')
        notes = ''
      }
      
      // Determine status - handle old reports without status field
      let reportStatus = report.status
      if (!reportStatus) {
        // Fallback for old reports
        reportStatus = report.resolved ? 'resolved' : 'pending'
      }
      
      return {
        _id: report._id,
        jobId: report.job._id,
        title: report.job.title,
        company: report.job.company,
        report: {
          _id: report._id,
          reason: report.reason,
          description: report.description,
          reportedAt: report.createdAt,
          status: reportStatus,
          notes: notes,
          resolution: resolution,
          category: report.reason.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z_]/g, ''),
          severity: 'medium' // Default severity
        },
        reportedBy: report.reportedBy || { name: '[Deleted User]', email: '', _id: null }
      }
    })

    res.json({
      success: true,
      data: transformedReports,
      pagination: {
        total: totalValid,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalValid / parseInt(limit))
=======
 * Get all job reports with filters
 */
const getAllJobReports = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category, severity } = req.query

    const matchStage = { 'adminReports.0': { $exists: true } }
    
    const jobs = await Job.aggregate([
      { $match: matchStage },
      { $unwind: '$adminReports' },
      {
        $match: {
          ...(status && { 'adminReports.status': status }),
          ...(category && { 'adminReports.category': category }),
          ...(severity && { 'adminReports.severity': severity })
        }
      },
      { $sort: { 'adminReports.reportedAt': -1 } },
      {
        $lookup: {
          from: 'users',
          localField: 'adminReports.reportedBy',
          foreignField: '_id',
          as: 'reportedByUser'
        }
      },
      {
        $project: {
          jobId: '$_id',
          title: 1,
          company: 1,
          report: '$adminReports',
          reportedBy: { $arrayElemAt: ['$reportedByUser', 0] }
        }
      },
      { $skip: (parseInt(page) - 1) * parseInt(limit) },
      { $limit: parseInt(limit) }
    ])

    const totalCount = await Job.aggregate([
      { $match: matchStage },
      { $unwind: '$adminReports' },
      {
        $match: {
          ...(status && { 'adminReports.status': status }),
          ...(category && { 'adminReports.category': category }),
          ...(severity && { 'adminReports.severity': severity })
        }
      },
      { $count: 'total' }
    ])

    const total = totalCount[0]?.total || 0

    res.json({
      success: true,
      data: jobs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
>>>>>>> f9873058d0e7eb905fe9fba20468adc7056e7fa3
      }
    })
  } catch (error) {
    console.error('Error fetching all job reports:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// ==================== FEATURE 2: EMPLOYER VERIFICATION ====================

/**
 * GET /api/admin/verifications
 * Get all verification requests
 */
const getVerificationRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'pending' } = req.query

    const query = {
      role: { $in: ['employer', 'recruiter'] },
      verificationStatus: status
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const users = await User.find(query)
      .select('name email role verificationStatus verificationRequest isVerifiedEmployer employerProfile')
      .populate('verificationRequest.reviewedBy', 'name email')
      .sort({ 'verificationRequest.submittedAt': -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await User.countDocuments(query)

    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Error fetching verification requests:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * PATCH /api/admin/verifications/:id/review
 * Approve or reject verification request
 */
const reviewVerification = async (req, res) => {
  try {
    if (!validateId(req.params.id, res)) return

    const { action, rejectedReason } = req.body
    
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action' })
    }

    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    if (action === 'approve') {
      user.isVerifiedEmployer = true
      user.verificationStatus = 'approved'
    } else {
      user.isVerifiedEmployer = false
      user.verificationStatus = 'rejected'
      user.verificationRequest.rejectedReason = rejectedReason || 'Not specified'
    }

    user.verificationRequest.reviewedBy = req.user.id
    user.verificationRequest.reviewedAt = new Date()
    await user.save()

    await logAdminAction(
      req.user.id,
      action === 'approve' ? 'VERIFICATION_APPROVED' : 'VERIFICATION_REJECTED',
      'user',
      user._id,
      { userName: user.name, userEmail: user.email, rejectedReason }
    )

    res.json({
      success: true,
      message: `Verification ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      data: user
    })
  } catch (error) {
    console.error('Error reviewing verification:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * POST /api/admin/verifications/request
 * Submit verification request (for testing - normally done by employer)
 */
const requestVerification = async (req, res) => {
  try {
    const { userId, companyWebsite, companyRegNo, documents } = req.body

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    user.verificationStatus = 'pending'
    user.verificationRequest = {
      submittedAt: new Date(),
      companyWebsite,
      companyRegNo,
      documents: documents || []
    }
    await user.save()

    res.json({
      success: true,
      message: 'Verification request submitted',
      data: user
    })
  } catch (error) {
    console.error('Error requesting verification:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// ==================== FEATURE 3: ANNOUNCEMENT BANNERS ====================

/**
 * GET /api/admin/banners/active
 * Get active banners (public endpoint for displaying on site)
 */
const getActiveBanners = async (req, res) => {
  try {
    const now = new Date()
    const banners = await AnnouncementBanner.find({
      isActive: true,
      startDate: { $lte: now },
      $or: [
        { endDate: { $exists: false } },
        { endDate: null },
        { endDate: { $gte: now } }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(5)

    res.json({
      success: true,
      data: banners
    })
  } catch (error) {
    console.error('Error fetching active banners:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * GET /api/admin/banners
 * Get all banners with pagination
 */
const getAllBanners = async (req, res) => {
  try {
    const { page = 1, limit = 10, isActive } = req.query

    const query = {}
    if (isActive !== undefined) query.isActive = isActive === 'true'

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const banners = await AnnouncementBanner.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await AnnouncementBanner.countDocuments(query)

    res.json({
      success: true,
      data: banners,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Error fetching banners:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * POST /api/admin/banners
 * Create new banner
 */
const createBanner = async (req, res) => {
  try {
    const { message, type, startDate, endDate, dismissible, link, linkText } = req.body

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' })
    }

    const banner = await AnnouncementBanner.create({
      message,
      type: type || 'info',
      startDate: startDate || new Date(),
      endDate,
      dismissible: dismissible !== false,
      link,
      linkText,
      createdBy: req.user.id
    })

    await logAdminAction(
      req.user.id,
      'BANNER_CREATED',
      'banner',
      banner._id,
      { message, type }
    )

    res.json({
      success: true,
      message: 'Banner created successfully',
      data: banner
    })
  } catch (error) {
    console.error('Error creating banner:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * PATCH /api/admin/banners/:id
 * Update banner
 */
const updateBanner = async (req, res) => {
  try {
    if (!validateId(req.params.id, res)) return

    const updates = req.body
    const banner = await AnnouncementBanner.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )

    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' })
    }

    await logAdminAction(
      req.user.id,
      'BANNER_UPDATED',
      'banner',
      banner._id,
      { updates }
    )

    res.json({
      success: true,
      message: 'Banner updated successfully',
      data: banner
    })
  } catch (error) {
    console.error('Error updating banner:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * DELETE /api/admin/banners/:id
 * Delete banner
 */
const deleteBanner = async (req, res) => {
  try {
    if (!validateId(req.params.id, res)) return

    const banner = await AnnouncementBanner.findByIdAndDelete(req.params.id)

    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' })
    }

    await logAdminAction(
      req.user.id,
      'BANNER_DELETED',
      'banner',
      banner._id,
      { message: banner.message }
    )

    res.json({
      success: true,
      message: 'Banner deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting banner:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * PATCH /api/admin/banners/:id/toggle
 * Toggle banner active status
 */
const toggleBanner = async (req, res) => {
  try {
    if (!validateId(req.params.id, res)) return

    const banner = await AnnouncementBanner.findById(req.params.id)

    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' })
    }

    banner.isActive = !banner.isActive
    await banner.save()

    await logAdminAction(
      req.user.id,
      banner.isActive ? 'BANNER_ACTIVATED' : 'BANNER_DEACTIVATED',
      'banner',
      banner._id,
      { message: banner.message }
    )

    res.json({
      success: true,
      message: `Banner ${banner.isActive ? 'activated' : 'deactivated'} successfully`,
      data: banner
    })
  } catch (error) {
    console.error('Error toggling banner:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// ==================== FEATURE 4: BULK ACTIONS ====================

/**
 * PATCH /api/admin/users/bulk
 * Bulk update users
 */
const bulkUpdateUsers = async (req, res) => {
  try {
    const { userIds, action, value } = req.body

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, message: 'User IDs array is required' })
    }

    let updateData = {}
    let actionType = ''

    switch (action) {
      case 'ban':
        updateData = {
          isBanned: true,
          banReason: value || 'Bulk ban action',
          bannedAt: new Date(),
          bannedBy: req.user.id
        }
        actionType = 'USERS_BULK_BANNED'
        break
      case 'unban':
        updateData = {
          isBanned: false,
          banReason: null,
          bannedAt: null,
          bannedBy: null
        }
        actionType = 'USERS_BULK_UNBANNED'
        break
      case 'changeRole':
        if (!value) {
          return res.status(400).json({ success: false, message: 'Role value is required' })
        }
        updateData = { role: value }
        actionType = 'USERS_BULK_ROLE_CHANGED'
        break
      case 'delete':
        await User.deleteMany({ _id: { $in: userIds } })
        await Job.deleteMany({ postedBy: { $in: userIds } })
        await Application.deleteMany({ applicant: { $in: userIds } })
        
        await logAdminAction(
          req.user.id,
          'USERS_BULK_DELETED',
          'user',
          null,
          { count: userIds.length, userIds }
        )

        return res.json({
          success: true,
          message: `${userIds.length} users deleted successfully`
        })
      default:
        return res.status(400).json({ success: false, message: 'Invalid action' })
    }

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { $set: updateData }
    )

    await logAdminAction(
      req.user.id,
      actionType,
      'user',
      null,
      { count: result.modifiedCount, action, value, userIds }
    )

    res.json({
      success: true,
      message: `${result.modifiedCount} users updated successfully`,
      data: { modifiedCount: result.modifiedCount }
    })
  } catch (error) {
    console.error('Error bulk updating users:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * PATCH /api/admin/jobs/bulk
 * Bulk update jobs
 */
const bulkUpdateJobs = async (req, res) => {
  try {
    const { jobIds, action, value } = req.body

    if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Job IDs array is required' })
    }

    let updateData = {}
    let actionType = ''

    switch (action) {
      case 'changeStatus':
        if (!value) {
          return res.status(400).json({ success: false, message: 'Status value is required' })
        }
        updateData = { status: value }
        actionType = 'JOBS_BULK_STATUS_CHANGED'
        break
      case 'feature':
        updateData = { isFeatured: true }
        actionType = 'JOBS_BULK_FEATURED'
        break
      case 'unfeature':
        updateData = { isFeatured: false }
        actionType = 'JOBS_BULK_UNFEATURED'
        break
      case 'delete':
        await Job.deleteMany({ _id: { $in: jobIds } })
        await Application.deleteMany({ job: { $in: jobIds } })
        
        await logAdminAction(
          req.user.id,
          'JOBS_BULK_DELETED',
          'job',
          null,
          { count: jobIds.length, jobIds }
        )

        return res.json({
          success: true,
          message: `${jobIds.length} jobs deleted successfully`
        })
      default:
        return res.status(400).json({ success: false, message: 'Invalid action' })
    }

    const result = await Job.updateMany(
      { _id: { $in: jobIds } },
      { $set: updateData }
    )

    await logAdminAction(
      req.user.id,
      actionType,
      'job',
      null,
      { count: result.modifiedCount, action, value, jobIds }
    )

    res.json({
      success: true,
      message: `${result.modifiedCount} jobs updated successfully`,
      data: { modifiedCount: result.modifiedCount }
    })
  } catch (error) {
    console.error('Error bulk updating jobs:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// ==================== FEATURE 5: ADMIN NOTES ====================

/**
 * GET /api/admin/notes/:entityType/:entityId
 * Get notes for an entity
 */
const getEntityNotes = async (req, res) => {
  try {
    const { entityType, entityId } = req.params

    const notes = await AdminNote.find({ entityType, entityId })
      .populate('createdBy', 'name email avatar')
      .sort({ isPinned: -1, createdAt: -1 })

    res.json({
      success: true,
      data: notes
    })
  } catch (error) {
    console.error('Error fetching notes:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * POST /api/admin/notes
 * Create a new note
 */
const createNote = async (req, res) => {
  try {
    const { entityType, entityId, note, color, isPinned } = req.body

    if (!entityType || !entityId || !note) {
      return res.status(400).json({
        success: false,
        message: 'Entity type, entity ID, and note are required'
      })
    }

    const newNote = await AdminNote.create({
      entityType,
      entityId,
      note,
      color: color || 'yellow',
      isPinned: isPinned || false,
      createdBy: req.user.id
    })

    const populatedNote = await AdminNote.findById(newNote._id)
      .populate('createdBy', 'name email avatar')

    await logAdminAction(
      req.user.id,
      'NOTE_CREATED',
      entityType,
      entityId,
      { noteId: newNote._id }
    )

    res.json({
      success: true,
      message: 'Note created successfully',
      data: populatedNote
    })
  } catch (error) {
    console.error('Error creating note:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * PATCH /api/admin/notes/:id
 * Update a note
 */
const updateNote = async (req, res) => {
  try {
    if (!validateId(req.params.id, res)) return

    const { note, color, isPinned } = req.body

    const existingNote = await AdminNote.findById(req.params.id)
    if (!existingNote) {
      return res.status(404).json({ success: false, message: 'Note not found' })
    }

    if (note !== undefined) existingNote.note = note
    if (color !== undefined) existingNote.color = color
    if (isPinned !== undefined) existingNote.isPinned = isPinned

    await existingNote.save()

    const updatedNote = await AdminNote.findById(existingNote._id)
      .populate('createdBy', 'name email avatar')

    await logAdminAction(
      req.user.id,
      'NOTE_UPDATED',
      existingNote.entityType,
      existingNote.entityId,
      { noteId: existingNote._id }
    )

    res.json({
      success: true,
      message: 'Note updated successfully',
      data: updatedNote
    })
  } catch (error) {
    console.error('Error updating note:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * DELETE /api/admin/notes/:id
 * Delete a note
 */
const deleteNote = async (req, res) => {
  try {
    if (!validateId(req.params.id, res)) return

    const note = await AdminNote.findByIdAndDelete(req.params.id)

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' })
    }

    await logAdminAction(
      req.user.id,
      'NOTE_DELETED',
      note.entityType,
      note.entityId,
      { noteId: note._id }
    )

    res.json({
      success: true,
      message: 'Note deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting note:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// ==================== FEATURE 6: PLATFORM HEALTH ====================

/**
 * GET /api/admin/health
 * Get platform health metrics
 */
const getPlatformHealth = async (req, res) => {
  try {
    // Database stats
    const dbStats = await mongoose.connection.db.stats()
    
    // Collection stats
    const userCount = await User.countDocuments()
    const jobCount = await Job.countDocuments({ deletedAt: null })
    const applicationCount = await Application.countDocuments()
    const announcementCount = await AnnouncementBanner.countDocuments()
    const auditLogCount = await AuditLog.countDocuments()
    
    // Job reports count
    const reportCount = await Job.aggregate([
      { $project: { reportCount: { $size: { $ifNull: ['$adminReports', []] } } } },
      { $group: { _id: null, total: { $sum: '$reportCount' } } }
    ])
    
    // System stats
    const systemStats = {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      usedMemory: os.totalmem() - os.freemem(),
      memoryUsagePercent: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2),
      osUptime: os.uptime(),          // Machine/OS uptime
      nodeVersion: process.version
    }

    // Process stats
    const processStats = {
      pid: process.pid,
      appUptime: process.uptime(),    // Actual application/server uptime
      memoryUsage: process.memoryUsage()
    }

    // Database connection status
    const dbStatus = mongoose.connection.readyState // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
    const dbStatusLabel = ['disconnected', 'connected', 'connecting', 'disconnecting'][dbStatus] || 'unknown'

    // Recent activity (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentUsers = await User.countDocuments({ createdAt: { $gte: oneHourAgo } })
    const recentJobs = await Job.countDocuments({ createdAt: { $gte: oneHourAgo } })
    const recentApplications = await Application.countDocuments({ createdAt: { $gte: oneHourAgo } })

    res.json({
      success: true,
      data: {
        database: {
          collections: dbStats.collections,
          dataSize: dbStats.dataSize,
          storageSize: dbStats.storageSize,
          indexes: dbStats.indexes,
          indexSize: dbStats.indexSize,
          avgObjSize: dbStats.avgObjSize,
          status: dbStatusLabel,
          connectionState: dbStatus
        },
        collections: {
          users: userCount,
          jobs: jobCount,
          applications: applicationCount,
          announcements: announcementCount,
          auditLogs: auditLogCount,
          jobReports: reportCount[0]?.total || 0
        },
        system: systemStats,
        process: processStats,
        recentActivity: {
          lastHour: {
            users: recentUsers,
            jobs: recentJobs,
            applications: recentApplications
          }
        },
        timestamp: new Date()
      }
    })
  } catch (error) {
    console.error('Error fetching platform health:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// ==================== FEATURE 7: GLOBAL SEARCH ====================

/**
 * GET /api/admin/search
 * Global search across users, jobs, and applications
 */
const globalSearch = async (req, res) => {
  try {
    const { q, limit = 5 } = req.query

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      })
    }

    const searchRegex = new RegExp(q, 'i')
    const limitNum = parseInt(limit)

    // Search users
    const users = await User.find({
      $or: [
        { name: searchRegex },
        { email: searchRegex }
      ]
    })
      .select('name email role avatar onboardingComplete')
      .limit(limitNum)

    // Search jobs
    const jobs = await Job.find({
      deletedAt: null,
      $or: [
        { title: searchRegex },
        { company: searchRegex },
        { description: searchRegex }
      ]
    })
      .select('title company location status createdAt')
      .populate('postedBy', 'name email')
      .limit(limitNum)

    // Search applications
    const applications = await Application.find({
      $or: [
        { status: searchRegex }
      ]
    })
      .select('status createdAt')
      .populate('applicant', 'name email')
      .populate('job', 'title company')
      .limit(limitNum)

    res.json({
      success: true,
      data: {
        users,
        jobs,
        applications,
        query: q
      }
    })
  } catch (error) {
    console.error('Error performing global search:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// ==================== FEATURE 8: DASHBOARD WIDGETS ====================

/**
 * GET /api/admin/dashboard/widgets
 * Get dashboard widget preferences
 */
const getDashboardWidgets = async (req, res) => {
  try {
    const settings = await Setting.findOne({ key: 'platform_settings' })
    
    if (!settings || !settings.dashboardWidgets) {
      return res.json({
        success: true,
        data: ['users', 'jobs', 'applications', 'pendingReviews', 'recentActivity', 'jobStatusChart', 'applicationFunnel', 'topEmployers']
      })
    }

    res.json({
      success: true,
      data: settings.dashboardWidgets
    })
  } catch (error) {
    console.error('Error fetching dashboard widgets:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * PATCH /api/admin/dashboard/widgets
 * Update dashboard widget preferences
 */
const updateDashboardWidgets = async (req, res) => {
  try {
    const { widgets } = req.body

    if (!widgets || !Array.isArray(widgets)) {
      return res.status(400).json({
        success: false,
        message: 'Widgets array is required'
      })
    }

    let settings = await Setting.findOne({ key: 'platform_settings' })

    if (!settings) {
      settings = await Setting.create({
        key: 'platform_settings',
        dashboardWidgets: widgets,
        updatedBy: req.user.id
      })
    } else {
      settings.dashboardWidgets = widgets
      settings.updatedBy = req.user.id
      await settings.save()
    }

    await logAdminAction(
      req.user.id,
      'DASHBOARD_WIDGETS_UPDATED',
      'setting',
      settings._id,
      { widgets }
    )

    res.json({
      success: true,
      message: 'Dashboard widgets updated successfully',
      data: settings.dashboardWidgets
    })
  } catch (error) {
    console.error('Error updating dashboard widgets:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}



// ==================== MODULE EXPORTS ====================
module.exports = {
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
  // Feature 1: Job Reports
  reportJob,
  getJobReports,
  resolveJobReport,
  getAllJobReports,
  // Feature 2: Employer Verification
  getVerificationRequests,
  reviewVerification,
  requestVerification,
  // Feature 3: Announcement Banners
  getActiveBanners,
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBanner,
  // Feature 4: Bulk Actions
  bulkUpdateUsers,
  bulkUpdateJobs,
  // Feature 5: Admin Notes
  getEntityNotes,
  createNote,
  updateNote,
  deleteNote,
  // Feature 6: Platform Health
  getPlatformHealth,
  // Feature 7: Global Search
  globalSearch,
  // Feature 8: Dashboard Widgets
  getDashboardWidgets,
  updateDashboardWidgets
}
