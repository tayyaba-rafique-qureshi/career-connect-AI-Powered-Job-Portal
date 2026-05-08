const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { sendWelcomeEmail } = require('../services/emailService')

const generateToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' })

const buildAuthUserPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar || null,
  onboardingComplete: user.onboardingComplete,
  isProfileComplete: user.isProfileComplete,
  applicantProfile: user.applicantProfile || null,
  employerProfile: user.employerProfile || null,
})

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body

    // Basic validation
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required' })

    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' })

    // Prevent admin role from being set via public registration
    if (role === 'admin')
      return res.status(403).json({ message: 'Cannot register as admin' })

    const existing = await User.findOne({ email })
    if (existing)
      return res.status(400).json({ message: 'Email already in use' })

    const user = await User.create({ name, email, password, role })

    // Fire-and-forget — welcome email doesn't block registration response
    sendWelcomeEmail(user)

    res.status(201).json({
      token: generateToken(user),
      user: buildAuthUserPayload(user)
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' })

    const user = await User.findOne({ email })
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' })

    // Check if user is banned
    if (user.isBanned) {
      return res.status(403).json({
        message: `Your account has been banned. Reason: ${user.banReason || 'No reason provided'}`
      })
    }

    // Update last login
    user.lastLoginAt = new Date()
    user.loginCount = (user.loginCount || 0) + 1
    await user.save()

    res.json({
      token: generateToken(user),
      user: buildAuthUserPayload(user)
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const PasswordResetToken = require('../models/PasswordResetToken')
const { sendPasswordResetEmail } = require('../services/emailService')

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ message: 'Email is required' })

    const user = await User.findOne({ email: email.toLowerCase() })

    // Always return 200 — don't reveal whether email exists (security)
    if (!user) return res.json({ message: 'If that email exists, a reset link has been sent.' })

    // Google-only accounts have no password
    if (user.googleId && !user.password) {
      return res.json({ message: 'This account uses Google Sign-In. Please sign in with Google.' })
    }

    // Invalidate any existing tokens for this user
    await PasswordResetToken.deleteMany({ user: user._id })

    // Generate a secure random token
    const rawToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex')

    await PasswordResetToken.create({
      user:      user._id,
      token:     hashedToken,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
    })

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`
    sendPasswordResetEmail({ user, resetUrl })

    res.json({ message: 'If that email exists, a reset link has been sent.' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { token, email, newPassword } = req.body
    if (!token || !email || !newPassword)
      return res.status(400).json({ message: 'Token, email and new password are required' })

    if (newPassword.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' })

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    const resetRecord = await PasswordResetToken.findOne({
      token:     hashedToken,
      used:      false,
      expiresAt: { $gt: new Date() }
    })

    if (!resetRecord) return res.status(400).json({ message: 'Reset link is invalid or has expired' })

    const user = await User.findOne({ _id: resetRecord.user, email: email.toLowerCase() })
    if (!user) return res.status(400).json({ message: 'Invalid reset request' })

    user.password = newPassword  // pre-save hook hashes it
    await user.save()

    // Mark token as used
    resetRecord.used = true
    await resetRecord.save()

    res.json({ message: 'Password reset successfully. You can now sign in.' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// PATCH /api/auth/change-password  (authenticated)
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: 'Current and new password are required' })

    if (newPassword.length < 6)
      return res.status(400).json({ message: 'New password must be at least 6 characters' })

    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ message: 'User not found' })

    if (!user.password)
      return res.status(400).json({ message: 'This account uses Google Sign-In and has no password to change' })

    const match = await user.comparePassword(currentPassword)
    if (!match) return res.status(401).json({ message: 'Current password is incorrect' })

    if (currentPassword === newPassword)
      return res.status(400).json({ message: 'New password must be different from current password' })

    user.password = newPassword
    await user.save()

    res.json({ message: 'Password changed successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
