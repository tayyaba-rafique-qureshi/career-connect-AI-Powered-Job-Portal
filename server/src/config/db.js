const mongoose = require('mongoose')

const connectDB = async () => {
  const primary = process.env.MONGODB_URI
  const fallback =
    process.env.MONGODB_URI_FALLBACK ||
    'mongodb://127.0.0.1:27017/job-project'

  if (!primary) {
    console.warn('[db] MONGODB_URI not set. Trying local MongoDB at', fallback)
    try {
      const conn = await mongoose.connect(fallback)
      console.log(`MongoDB Connected: ${conn.connection.host}`)
      return
    } catch (error) {
      console.error('DB Connection Failed:', error.message)
      process.exit(1)
    }
  }

  try {
    const conn = await mongoose.connect(primary)
    console.log(`MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    // If Atlas SRV/DNS is blocked, local fallback makes dev runnable.
    console.error('DB Connection Failed:', error.message)
    console.warn('[db] Falling back to local MongoDB at', fallback)
    try {
      const conn = await mongoose.connect(fallback)
      console.log(`MongoDB Connected: ${conn.connection.host}`)
    } catch (fallbackErr) {
      console.error('DB Connection Failed:', fallbackErr.message)
      process.exit(1)
    }
  }
}

module.exports = connectDB
