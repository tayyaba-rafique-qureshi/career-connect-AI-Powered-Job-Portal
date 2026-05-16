const router = require('express').Router()
const { createReview, getEmployerReviews } = require('../controllers/reviewController')
const { protect } = require('../middleware/authMiddleware')

router.post('/:employerId', protect, createReview)
router.get('/:employerId', getEmployerReviews)

module.exports = router
