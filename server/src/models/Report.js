const mongoose = require('mongoose')

const reportSchema = new mongoose.Schema({
  job:         { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  reportedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason:      { type: String, required: true },
  description: { type: String, default: '' },
<<<<<<< HEAD
  resolved:    { type: Boolean, default: false },
  status:      { type: String, enum: ['pending', 'open', 'resolved', 'dismissed'], default: 'pending' }
=======
  resolved:    { type: Boolean, default: false }
>>>>>>> f9873058d0e7eb905fe9fba20468adc7056e7fa3
}, { timestamps: true })

module.exports = mongoose.model('Report', reportSchema)
