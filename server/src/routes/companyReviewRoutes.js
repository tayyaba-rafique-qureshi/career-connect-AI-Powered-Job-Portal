const router = require('express').Router()
const { protect } = require('../middleware/authMiddleware')
const { getCompanies, getReviews, addReview } = require('../controllers/companyReviewController')

router.get('/companies',          getCompanies)           // public
router.get('/:companyName',       getReviews)             // public
router.post('/:companyName',      protect, addReview)     // authenticated

module.exports = router
