const Review = require('../models/Review')

// POST /api/reviews/:employerId — Applicant leaves a review
exports.createReview = async (req, res) => {
  try {
    const { rating, title, reviewText } = req.body
    if (!rating || !title || !reviewText) {
      return res.status(400).json({ message: 'Rating, title, and reviewText are required' })
    }

    const review = await Review.create({
      employer: req.params.employerId,
      applicant: req.user.id,
      rating,
      title,
      reviewText
    })

    res.status(201).json(review)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/reviews/:employerId — Get all reviews for an employer
exports.getEmployerReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ employer: req.params.employerId })
      .populate('applicant', 'name avatar')
      .sort({ createdAt: -1 })
    
    // Calculate average rating
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0)
    const avgRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0

    res.json({
      avgRating,
      totalReviews: reviews.length,
      reviews
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
