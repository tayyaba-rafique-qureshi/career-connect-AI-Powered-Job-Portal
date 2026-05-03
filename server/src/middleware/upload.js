const multer = require('multer')

/**
 * Use memory storage — file is held in buffer.
 * The onboarding controller streams it to GridFS manually.
 * This avoids multer-gridfs-storage connection timing issues.
 */
const storage = multer.memoryStorage()

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true)
  } else {
    cb(new Error('Only PDF files are allowed'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB strict limit
})

module.exports = upload
