const router = require('express').Router()
const { protect } = require('../middleware/authMiddleware')
const upload = require('../middleware/upload')
const { saveStep, getMe, downloadResume, getResumeData, saveResumeData, generateResumePDF, setAiSource } = require('../controllers/onboardingController')

router.get('/me', protect, getMe)

// Resume builder structured data
router.get('/resume-data', protect, getResumeData)
router.patch('/resume-data', protect, saveResumeData)

// Generate ATS PDF from resume builder data (server-side, pdf-lib)
router.post('/resume-pdf', protect, generateResumePDF)

// Switch which resume powers AI job matching
router.patch('/ai-source', protect, setAiSource)

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
