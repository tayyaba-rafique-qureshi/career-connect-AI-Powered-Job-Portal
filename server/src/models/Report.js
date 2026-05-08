const mongoose = require('mongoose')

const reportSchema = new mongoose.Schema({
  job:         { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  reportedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason:      { type: String, required: true },
  description: { type: String, default: '' },
  resolved:    { type: Boolean, default: false }
}, { timestamps: true })

module.exports = mongoose.model('Report', reportSchema)
