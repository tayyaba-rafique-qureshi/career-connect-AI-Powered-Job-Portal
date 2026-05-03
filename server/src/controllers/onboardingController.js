const mongoose = require('mongoose')
const axios = require('axios')
const User = require('../models/User')
const { getBucket } = require('../config/gridfs')
const compressPdf = require('../utils/compressPdf')
const { sendOnboardingCompleteEmail } = require('../services/emailService')

// ─── Helper: upload buffer to GridFS ─────────────────────────────────────────
const uploadToGridFS = (buffer, filename) => {
  return new Promise((resolve, reject) => {
    const bucket = getBucket()
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: 'application/pdf'
    })
    uploadStream.on('finish', () => resolve(uploadStream.id))
    uploadStream.on('error', reject)
    uploadStream.end(buffer)
  })
}
const deleteOldResume = async (fileId) => {
  if (!fileId) return
  try {
    const bucket = getBucket()
    await bucket.delete(new mongoose.Types.ObjectId(fileId))
    console.log(`[GridFS] Deleted old resume: ${fileId}`)
  } catch (err) {
    console.error(`[GridFS] Failed to delete old resume ${fileId}:`, err.message)
  }
}

// ─── Helper: call Python AI to extract text ───────────────────────────────────
const extractResumeText = async (fileId) => {
  try {
    const { data } = await axios.post(
      `${process.env.AI_SERVICE_URL}/api/extract-resume`,
      { fileId: fileId.toString() },
      { timeout: 30000 }
    )
    return data.extractedText || ''
  } catch (err) {
    console.error('[AI] Resume extraction failed:', err.message)
    return '' // graceful fallback — PDF still saved
  }
}

// ─── PATCH /api/users/onboarding ─────────────────────────────────────────────
exports.saveStep = async (req, res) => {
  try {
    // step and role come as strings in multipart/form-data (step 5)
    // or as parsed values in JSON body (steps 1-4)
    const step = parseInt(req.body.step)
    const role = req.body.role

    // data can be:
    // - a JSON string (multipart step 5: FormData appends it as string)
    // - already an object (JSON body steps 1-4: express.json() parses it)
    let data = {}
    if (req.body.data) {
      data = typeof req.body.data === 'string'
        ? JSON.parse(req.body.data)
        : req.body.data
    }

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
        // Handle resume file upload
        if (req.file) {
          // Delete old resume from GridFS if exists
          if (p.resume?.fileId) await deleteOldResume(p.resume.fileId)

          // Compress PDF before storing (lossless, falls back to original if no gain)
          const { buffer, originalSize, compressedSize, compressed } = await compressPdf(req.file.buffer)

          // Upload (possibly compressed) buffer to GridFS
          const filename = `resume_${req.user.id}_${Date.now()}.pdf`
          const fileId = await uploadToGridFS(buffer, filename)

          // Extract text via Python AI service
          const rawText = await extractResumeText(fileId)

          p.resume = {
            fileId,
            fileName:       filename,
            uploadedAt:     new Date(),
            rawText,
            originalSize,   // stored for transparency / debugging
            storedSize:     compressedSize,
            wasCompressed:  compressed
          }
        }

        // Save other step 5 fields
        p.profileSummary = data.profileSummary || p.profileSummary
        p.linkedinUrl    = data.linkedinUrl    || p.linkedinUrl
        p.portfolioUrl   = data.portfolioUrl   || p.portfolioUrl
        user.onboardingComplete = true
        sendOnboardingCompleteEmail(user)
      }

      user.markModified('applicantProfile')
    }

    if (role === 'employer') {
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

    res.json({
      message: 'Saved',
      onboardingStep: user.onboardingStep,
      onboardingComplete: user.onboardingComplete
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ─── GET /api/users/me ────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password')
    res.json(user)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ─── GET /api/users/resume/:fileId — stream PDF to client ────────────────────
exports.downloadResume = async (req, res) => {
  try {
    const bucket = getBucket()
    const fileId = new mongoose.Types.ObjectId(req.params.fileId)

    // Verify the requesting user owns this resume
    const user = await User.findById(req.user.id)
    const resumeFileId = user?.applicantProfile?.resume?.fileId?.toString()
    if (resumeFileId !== req.params.fileId) {
      return res.status(403).json({ message: 'Access denied' })
    }

    res.set('Content-Type', 'application/pdf')
    res.set('Content-Disposition', 'inline')
    bucket.openDownloadStream(fileId).pipe(res)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
