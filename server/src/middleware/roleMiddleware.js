/**
 * Usage: router.get('/admin/users', protect, requireRole('admin'), handler)
 * Can accept multiple roles: requireRole('admin', 'recruiter')
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied: insufficient permissions' })
  }
  next()
}

module.exports = { requireRole }
