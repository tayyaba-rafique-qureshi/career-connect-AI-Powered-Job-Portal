const mongoose = require('mongoose')
const { GridFSBucket } = require('mongodb')

let bucket

/**
 * Initialize GridFS bucket after mongoose connects.
 * Call this once from index.js after connectDB().
 */
const initGridFS = () => {
  const db = mongoose.connection.db
  bucket = new GridFSBucket(db, { bucketName: 'uploads' })
  console.log('GridFS bucket initialized')
}

const getBucket = () => {
  if (!bucket) throw new Error('GridFS not initialized. Call initGridFS() first.')
  return bucket
}

module.exports = { initGridFS, getBucket }
