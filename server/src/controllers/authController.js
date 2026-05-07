const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { sendWelcomeEmail } = require('../services/emailService')

const generateToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' })

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
      user: { id: user._id, name: user.name, role: user.role, onboardingComplete: user.onboardingComplete }
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
      user: { id: user._id, name: user.name, role: user.role, onboardingComplete: user.onboardingComplete }
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
