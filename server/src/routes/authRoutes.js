const router = require('express').Router()
const passport = require('passport')
const jwt = require('jsonwebtoken')
const { register, login } = require('../controllers/authController')

// Email/password auth
router.post('/register', register)
router.post('/login', login)

// Google OAuth — step 1: redirect to Google
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false
}))

// Google OAuth — step 2: Google redirects back here
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=google_failed` }),
  (req, res) => {
    const user = req.user
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' })

    const userData = encodeURIComponent(JSON.stringify({
      id: user._id, name: user.name, role: user.role,
      avatar: user.avatar, isProfileComplete: user.isProfileComplete
    }))

    // Redirect to frontend with token + user in query params
    // Frontend will extract these and store in localStorage
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}&user=${userData}`)
  }
)

module.exports = router
