const router = require('express').Router()
const { protect } = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')
const {
  getAllUsers,
  getAllJobs,
  getAllApplications,
  deleteUser
} = require('../controllers/adminController')

// All admin routes require valid JWT + admin role
router.use(protect, requireRole('admin'))

router.get('/users', getAllUsers)
router.get('/jobs', getAllJobs)
router.get('/applications', getAllApplications)
router.delete('/users/:id', deleteUser)

module.exports = router
