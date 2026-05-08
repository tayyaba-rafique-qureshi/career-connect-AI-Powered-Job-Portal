const dotenv = require('dotenv')
dotenv.config()

const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const passport = require('./config/passport')
const connectDB = require('./config/db')
const { initGridFS } = require('./config/gridfs')

connectDB()

// Initialize GridFS after mongoose connects
mongoose.connection.once('open', () => {
  initGridFS()
})

const app = express()
app.use(cors({
  origin: [process.env.CLIENT_URL, 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:5173'],
  credentials: true
}))
app.use(express.json())
app.use(passport.initialize())

// Routes
app.use('/api/auth', require('./routes/authRoutes'))
app.use('/api/jobs', require('./routes/jobRoutes'))
app.use('/api/applications', require('./routes/applicationRoutes'))
app.use('/api/admin', require('./routes/adminRoutes'))
app.use('/api/users', require('./routes/onboardingRoutes'))
app.use('/api/saved-jobs', require('./routes/savedJobRoutes'))
app.use('/api/notifications', require('./routes/notificationRoutes'))
app.use('/api/ai', require('./routes/aiRoutes'))
app.use('/api/company-reviews', require('./routes/companyReviewRoutes'))
app.use('/api/reviews', require('./routes/reviewRoutes'))
app.use('/api/messages', require('./routes/messageRoutes'))

const PORT = process.env.PORT || 5001
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
