const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const User = require('../models/User')
const { sendWelcomeEmail } = require('../services/emailService')

passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL:  '/api/auth/google/callback'
},
async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists by googleId or email
    let user = await User.findOne({ googleId: profile.id })

    if (!user) {
      user = await User.findOne({ email: profile.emails[0].value })
      if (user) {
        // Existing email user — link Google account
        user.googleId = profile.id
        user.avatar = profile.photos[0]?.value
        await user.save()
      } else {
        // Brand new user via Google — send welcome email
        user = await User.create({
          name:     profile.displayName,
          email:    profile.emails[0].value,
          googleId: profile.id,
          avatar:   profile.photos[0]?.value,
          role:     'applicant',
          isProfileComplete: false
        })
        sendWelcomeEmail(user)
      }
    }

    return done(null, user)
  } catch (err) {
    return done(err, null)
  }
}))

module.exports = passport
