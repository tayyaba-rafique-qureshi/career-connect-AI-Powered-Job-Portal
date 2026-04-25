const router = require('express').Router()
const { protect } = require('../middleware/authMiddleware')
const { saveStep, getMe } = require('../controllers/onboardingController')

router.get('/me', protect, getMe)
router.patch('/onboarding', protect, saveStep)

module.exports = router
