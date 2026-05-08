const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema({
  employer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, required: true },
  reviewText: { type: String, required: true }
}, { timestamps: true })

module.exports = mongoose.model('Review', reviewSchema)
