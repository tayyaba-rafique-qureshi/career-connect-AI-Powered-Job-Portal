const mongoose = require('mongoose')

const announcementBannerSchema = new mongoose.Schema({
  message:     { type: String, required: true },
  type:        { type: String, enum: ['info', 'warning', 'success', 'error'], default: 'info' },
  isActive:    { type: Boolean, default: true },
  startDate:   { type: Date, default: Date.now },
  endDate:     { type: Date },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dismissible: { type: Boolean, default: true },
  link:        { type: String },
  linkText:    { type: String }
}, { timestamps: true })

module.exports = mongoose.model('AnnouncementBanner', announcementBannerSchema)
