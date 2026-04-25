const dotenv = require('dotenv')
dotenv.config()                        // must be first — before any module reads process.env

const express = require('express')
const cors = require('cors')
const passport = require('./config/passport')
const connectDB = require('./config/db')
connectDB()

const app = express()
app.use(cors({
  origin: [process.env.CLIENT_URL, 'http://localhost:3000', 'http://localhost:3001'],
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

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
