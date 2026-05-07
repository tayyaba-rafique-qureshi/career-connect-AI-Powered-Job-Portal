const mongoose = require('mongoose')

const adminNoteSchema = new mongoose.Schema({
  entityType:  { type: String, enum: ['user', 'job'], required: true },
  entityId:    { type: mongoose.Schema.Types.ObjectId, required: true },
  note:        { type: String, required: true, maxlength: 1000 },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isPinned:    { type: Boolean, default: false },
  color:       { type: String, enum: ['yellow', 'red', 'blue', 'green'], default: 'yellow' }
}, { timestamps: true })

adminNoteSchema.index({ entityType: 1, entityId: 1 })

module.exports = mongoose.model('AdminNote', adminNoteSchema)
