const User = require('../models/User')
const { sendOnboardingCompleteEmail } = require('../services/emailService')

// PATCH /api/users/onboarding
exports.saveStep = async (req, res) => {
  try {
    const { step, role, data } = req.body
    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ message: 'User not found' })

    if (role === 'applicant' || role === 'recruiter') {
      if (!user.applicantProfile) user.applicantProfile = {}
      const p = user.applicantProfile

      if (step === 1) p.basicInfo        = { ...p.basicInfo,        ...data }
      if (step === 2) p.professionalInfo = { ...p.professionalInfo, ...data }
      if (step === 3) { p.skills = data.skills; p.tools = data.tools; p.certifications = data.certifications }
      if (step === 4) p.preferences      = { ...p.preferences,      ...data }
      if (step === 5) {
        p.resume         = { ...p.resume, ...data.resume, lastUpdated: new Date() }
        p.profileSummary = data.profileSummary
        p.linkedinUrl    = data.linkedinUrl
        p.portfolioUrl   = data.portfolioUrl
        user.onboardingComplete = true
        sendOnboardingCompleteEmail(user)
      }
      user.markModified('applicantProfile')
    }

    if (role === 'employer') {
      // Update role if coming from Google (defaulted to applicant)
      if (user.role !== 'employer') user.role = 'employer'
      if (!user.employerProfile) user.employerProfile = {}
      const p = user.employerProfile

      if (step === 1) p.companyInfo  = { ...p.companyInfo,  ...data }
      if (step === 2) p.location     = { ...p.location,     ...data }
      if (step === 3) {
        p.hiringPrefs = { ...p.hiringPrefs, ...data }
        user.onboardingComplete = true
        sendOnboardingCompleteEmail(user)
      }
      user.markModified('employerProfile')
    }

    user.onboardingStep = step
    await user.save()

    res.json({ message: 'Saved', onboardingStep: user.onboardingStep, onboardingComplete: user.onboardingComplete })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/users/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password')
    res.json(user)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
