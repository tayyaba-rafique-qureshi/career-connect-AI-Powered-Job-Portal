const mongoose = require('mongoose')

const dislikedJobSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  job:  { type: mongoose.Schema.Types.ObjectId, ref: 'Job',  required: true }
}, { timestamps: true })

dislikedJobSchema.index({ user: 1, job: 1 }, { unique: true })

module.exports = mongoose.model('DislikedJob', dislikedJobSchema)
