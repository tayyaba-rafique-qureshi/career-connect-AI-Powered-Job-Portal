const router = require('express').Router()
const { protect } = require('../middleware/authMiddleware')
const upload = require('../middleware/upload')
const { saveStep, getMe, downloadResume } = require('../controllers/onboardingController')

router.get('/me', protect, getMe)

// Step 5 sends multipart/form-data (file upload)
// Other steps send JSON — multer handles both gracefully
router.patch('/onboarding', protect, (req, res, next) => {
  upload.single('resume')(req, res, (err) => {
    if (err) {
      // Multer errors (file too large, wrong type)
      return res.status(400).json({ message: err.message })
    }
    next()
  })
}, saveStep)

// Stream resume PDF to authorized user
router.get('/resume/:fileId', protect, downloadResume)

module.exports = router
