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
      `${process.env.AI_SERVICE_URL}/api/ai/extract-resume`,
      { file_id: fileId.toString() },   // field name must match Python ExtractRequest schema
      { timeout: 30000 }
    )
    // Python returns { success, message, characterCount, preview, extractedText }
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
      const isOnboarding = !user.onboardingComplete

      if (step === 1) p.basicInfo        = { ...p.basicInfo,        ...data }
      if (step === 2) p.professionalInfo = { ...p.professionalInfo, ...data }
      if (step === 3) { p.skills = data.skills; p.tools = data.tools; p.certifications = data.certifications }
      if (step === 4) p.preferences      = { ...p.preferences,      ...data }

      if (step === 5) {
        const hasExistingResume = !!p.resume?.fileId

        if (!req.file && isOnboarding && !hasExistingResume) {
          return res.status(400).json({ message: 'Resume is required to complete onboarding' })
        }

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
          if (!rawText || !rawText.trim()) {
            console.warn('[Onboarding] Resume text extraction failed - AI service may be unavailable')
            // Allow onboarding to complete without text extraction
            // Text can be extracted later when AI service is available
            p.resume = {
              fileId,
              fileName:         filename,
              uploadedAt:       new Date(),
              rawText:          '', // Empty but allowed - can be populated later
              uploadedRawText:  '',
              aiPreference:     'uploaded',
              originalSize,
              storedSize:       compressedSize,
              wasCompressed:    compressed
            }
          } else {
            p.resume = {
              fileId,
              fileName:         filename,
              uploadedAt:       new Date(),
              rawText,
              uploadedRawText:  rawText,
              aiPreference:     'uploaded',
              originalSize,
              storedSize:       compressedSize,
              wasCompressed:    compressed
            }
          }
        } else if (isOnboarding && hasExistingResume && !p.resume?.rawText?.trim()) {
          // Try to extract text from existing resume
          const rawText = await extractResumeText(p.resume.fileId)
          if (!rawText || !rawText.trim()) {
            console.warn('[Onboarding] Could not extract text from existing resume - AI service may be unavailable')
            // Allow onboarding to complete - text can be extracted later
            p.resume = { ...p.resume, rawText: '', uploadedRawText: '' }
          } else {
            p.resume = { ...p.resume, rawText, uploadedRawText: rawText }
          }
        }

        // Save other step 5 fields
        p.profileSummary = data.profileSummary || p.profileSummary
        p.linkedinUrl    = data.linkedinUrl    || p.linkedinUrl
        p.portfolioUrl   = data.portfolioUrl   || p.portfolioUrl

        if (isOnboarding) {
          user.onboardingComplete = true
          sendOnboardingCompleteEmail(user)
        }
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

// ─── Helper: build plain-text from structured resumeData (for AI matching) ────
function buildResumeRawText (rd) {
  const lines = []

  // Header
  if (rd.fullName)  lines.push(rd.fullName)
  const contactParts = [rd.email, rd.phone, rd.location, rd.linkedin].filter(Boolean)
  if (contactParts.length) lines.push(contactParts.join(' | '))
  lines.push('')

  // Summary
  if (rd.summary) {
    lines.push('SUMMARY')
    lines.push(rd.summary)
    lines.push('')
  }

  // Skills
  if (rd.skills?.length) {
    lines.push('SKILLS')
    lines.push(rd.skills.join(', '))
    lines.push('')
  }

  // Work Experience
  if (rd.workExperience?.length) {
    lines.push('WORK EXPERIENCE')
    for (const e of rd.workExperience) {
      if (!e.jobTitle && !e.company) continue
      const tenure = [e.startDate, e.current ? 'Present' : e.endDate].filter(Boolean).join(' – ')
      lines.push(`${e.jobTitle || ''}${e.company ? ' at ' + e.company : ''}${tenure ? ' (' + tenure + ')' : ''}`)
      for (const b of (e.bullets || [])) { if (b?.trim()) lines.push('- ' + b.trim()) }
    }
    lines.push('')
  }

  // Projects
  if (rd.projects?.length) {
    lines.push('PROJECTS')
    for (const p of rd.projects) {
      if (!p.name) continue
      lines.push(`${p.name}${p.techStack ? ' | ' + p.techStack : ''}`)
      if (p.description) lines.push(p.description)
    }
    lines.push('')
  }

  // Education
  if (rd.education?.length) {
    lines.push('EDUCATION')
    for (const e of rd.education) {
      if (!e.degree && !e.institution) continue
      lines.push(`${e.degree || ''}${e.institution ? ' – ' + e.institution : ''}${e.year ? ' (' + e.year + ')' : ''}${e.cgpa ? ' | GPA: ' + e.cgpa : ''}`)
    }
    lines.push('')
  }

  // Certifications
  if (rd.certifications?.length) {
    lines.push('CERTIFICATIONS')
    for (const c of rd.certifications) {
      if (!c.name) continue
      lines.push(`${c.name}${c.issuer ? ' | ' + c.issuer : ''}${c.year ? ' (' + c.year + ')' : ''}`)
    }
    lines.push('')
  }

  return lines.join('\n').trim()
}

// ─── GET /api/users/resume-data ──────────────────────────────────────────────
// Returns saved resume builder data + applicantProfile for pre-filling
exports.getResumeData = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('email resumeData applicantProfile')
    const hasBuilt    = !!(user.resumeData && (user.resumeData.fullName || user.resumeData.skills?.length))
    const resumeObj   = user.applicantProfile?.resume || {}
    const hasUploaded = !!(resumeObj.uploadedRawText || resumeObj.rawText)
    const aiPreference = resumeObj.aiPreference || 'uploaded'
    // aiSource is what is ACTUALLY active (preference constrained by what exists)
    const aiSource = hasBuilt && aiPreference === 'built' ? 'built'
                   : hasUploaded                          ? 'uploaded'
                   : 'none'
    res.json({
      email:            user.email || '',
      resumeData:       user.resumeData       || null,
      applicantProfile: user.applicantProfile || null,
      aiSource,         // 'built' | 'uploaded' | 'none'  — what is actually active
      aiPreference,     // user's stored preference
      hasBuilt,
      hasUploaded,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ─── PATCH /api/users/resume-data ────────────────────────────────────────────
// Saves the structured resume builder data AND syncs rawText for AI matching
exports.saveResumeData = async (req, res) => {
  try {
    const { resumeData } = req.body
    if (!resumeData) return res.status(400).json({ message: 'resumeData is required' })

    // Always store the built-resume text so we can switch to it later
    const builtRawText = buildResumeRawText(resumeData)

    // Fetch resume fields — need aiPreference AND uploadedRawText to backfill if needed
    const user = await User.findById(req.user.id)
      .select('applicantProfile.resume.aiPreference applicantProfile.resume.uploadedRawText applicantProfile.resume.rawText')
    const resume = user?.applicantProfile?.resume || {}
    const pref   = resume.aiPreference || 'uploaded'

    const updateFields = {
      resumeData: { ...resumeData, lastSaved: new Date() },
      'applicantProfile.resume.builtRawText': builtRawText,
    }
    if (pref === 'built') {
      updateFields['applicantProfile.resume.rawText'] = builtRawText
    }

    // ── Backfill uploadedRawText for users who uploaded before this field was added ──
    // If uploadedRawText is missing but rawText (PDF text) exists, preserve it now
    // so switching between sources works correctly in the future.
    if (!resume.uploadedRawText && resume.rawText && pref !== 'built') {
      updateFields['applicantProfile.resume.uploadedRawText'] = resume.rawText
    }

    await User.findByIdAndUpdate(req.user.id, { $set: updateFields })
    res.json({ success: true, message: 'Resume saved', aiSource: pref })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ─── PATCH /api/users/ai-source — switch which resume powers AI matching ──────
exports.setAiSource = async (req, res) => {
  try {
    const { source } = req.body  // 'built' | 'uploaded'
    if (!['built', 'uploaded'].includes(source)) {
      return res.status(400).json({ message: 'source must be "built" or "uploaded"' })
    }
    const user = await User.findById(req.user.id)
      .select('applicantProfile.resume resumeData')
    if (!user) return res.status(404).json({ message: 'User not found' })

    const resume = user.applicantProfile?.resume || {}

    // Build the update payload
    const updateFields = { 'applicantProfile.resume.aiPreference': source }

    if (source === 'built') {
      // Use stored builtRawText, or regenerate from resumeData if needed
      let activeRawText = resume.builtRawText
      if (!activeRawText && user.resumeData) {
        activeRawText = buildResumeRawText(user.resumeData)
      }
      if (!activeRawText) {
        return res.status(400).json({ message: 'No CareerCONNECT resume found. Build one first.' })
      }

      // ── CRITICAL: backfill uploadedRawText BEFORE overwriting rawText ──
      // For users who uploaded before this field was added — preserve the PDF
      // text now, while rawText still contains it, so "switch back" works.
      if (!resume.uploadedRawText && resume.rawText) {
        updateFields['applicantProfile.resume.uploadedRawText'] = resume.rawText
      }
      updateFields['applicantProfile.resume.rawText'] = activeRawText

    } else {
      // Switch back to the preserved uploaded PDF text
      // uploadedRawText should always exist after the backfill above,
      // but fall back to rawText only as a last resort for legacy accounts
      const activeRawText = resume.uploadedRawText || resume.rawText
      if (!activeRawText) {
        return res.status(400).json({ message: 'No uploaded resume found.' })
      }
      updateFields['applicantProfile.resume.rawText'] = activeRawText
    }

    await User.findByIdAndUpdate(req.user.id, { $set: updateFields })
    res.json({ success: true, aiSource: source })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ─── POST /api/users/resume-pdf — generate ATS PDF with pdf-lib ──────────────
exports.generateResumePDF = async (req, res) => {
  try {
    const { PDFDocument, StandardFonts, rgb } = require('pdf-lib')

    const user = await User.findById(req.user.id).select('resumeData')
    const rd   = user?.resumeData
    if (!rd || !rd.fullName) {
      return res.status(404).json({ message: 'No resume data found. Build your resume first.' })
    }

    const pdfDoc   = await PDFDocument.create()
    const fontReg  = await pdfDoc.embedFont(StandardFonts.TimesRoman)
    const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
    const fontItal = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic)

    // Page setup — A4
    const PAGE_W = 595.28, PAGE_H = 841.89
    const ML = 50, MR = 50, MT = 50, MB = 50
    const CONTENT_W = PAGE_W - ML - MR

    let page = pdfDoc.addPage([PAGE_W, PAGE_H])
    let y    = PAGE_H - MT

    const black   = rgb(0,    0,    0)
    const grey    = rgb(0.30, 0.30, 0.30)
    const midgrey = rgb(0.45, 0.45, 0.45)
    const hexToRgb = (hex) => {
      const clean = String(hex || '').replace('#', '')
      if (!/^[0-9a-fA-F]{6}$/.test(clean)) return black
      return rgb(
        parseInt(clean.slice(0, 2), 16) / 255,
        parseInt(clean.slice(2, 4), 16) / 255,
        parseInt(clean.slice(4, 6), 16) / 255
      )
    }
    const accent = hexToRgb(rd.accentColor)

    const ensureSpace = (needed) => {
      if (y - needed < MB) {
        page = pdfDoc.addPage([PAGE_W, PAGE_H])
        y    = PAGE_H - MT
      }
    }

    const drawLine = (x1, x2, yPos, thickness = 0.5) => {
      page.drawLine({ start: { x: x1, y: yPos }, end: { x: x2, y: yPos }, thickness, color: accent })
    }

    const drawWrapped = (text, { x, font, size, color, maxW, leading }) => {
      if (!text) return
      const words = text.split(' ')
      let line = ''
      for (const word of words) {
        const test = line ? line + ' ' + word : word
        if (font.widthOfTextAtSize(test, size) > maxW && line) {
          ensureSpace(size + leading)
          page.drawText(line, { x, y, size, font, color })
          y -= (size + leading)
          line = word
        } else {
          line = test
        }
      }
      if (line) {
        ensureSpace(size + leading)
        page.drawText(line, { x, y, size, font, color })
        y -= (size + leading)
      }
    }

    const sectionHeading = (title) => {
      y -= 10
      ensureSpace(20)
      page.drawText(title.toUpperCase(), { x: ML, y, size: 9.5, font: fontBold, color: accent })
      y -= 12
      drawLine(ML, PAGE_W - MR, y + 2)
      y -= 6
    }

    // ── Name ──────────────────────────────────────────────────────────────────
    if (rd.fullName) {
      const nw = fontBold.widthOfTextAtSize(rd.fullName, 20)
      page.drawText(rd.fullName, { x: (PAGE_W - nw) / 2, y, size: 20, font: fontBold, color: accent })
      y -= 26
    }

    // ── Contact line ──────────────────────────────────────────────────────────
    const contactParts = [rd.phone, rd.email, rd.location, rd.linkedin].filter(Boolean)
    if (contactParts.length) {
      const cStr = contactParts.join('  ·  ')
      const cW   = fontReg.widthOfTextAtSize(cStr, 9)
      page.drawText(cStr, { x: (PAGE_W - cW) / 2, y, size: 9, font: fontReg, color: grey })
      y -= 16
    }

    // ── Summary ───────────────────────────────────────────────────────────────
    if (rd.summary) {
      sectionHeading('Professional Summary')
      drawWrapped(rd.summary, { x: ML, font: fontReg, size: 10, color: black, maxW: CONTENT_W, leading: 4 })
    }

    // ── Skills ────────────────────────────────────────────────────────────────
    if (rd.skills && rd.skills.length) {
      sectionHeading('Skills')
      drawWrapped(rd.skills.join('  ·  '), { x: ML, font: fontReg, size: 10, color: black, maxW: CONTENT_W, leading: 4 })
    }

    // ── Work Experience ───────────────────────────────────────────────────────
    const exps = (rd.workExperience || []).filter(e => e.jobTitle || e.company)
    if (exps.length) {
      sectionHeading('Work Experience')
      for (const e of exps) {
        ensureSpace(36)
        const dateStr = e.startDate
          ? `${e.startDate} – ${e.current ? 'Present' : (e.endDate || '')}`
          : (e.current ? 'Present' : (e.endDate || ''))
        if (e.jobTitle) {
          page.drawText(e.jobTitle, { x: ML, y, size: 10.5, font: fontBold, color: black })
          if (dateStr) {
            const dtW = fontReg.widthOfTextAtSize(dateStr, 9.5)
            page.drawText(dateStr, { x: PAGE_W - MR - dtW, y, size: 9.5, font: fontReg, color: midgrey })
          }
          y -= 14
        }
        if (e.company) {
          page.drawText(e.company, { x: ML, y, size: 10, font: fontItal, color: grey })
          y -= 13
        }
        for (const b of (e.bullets || []).filter(b => b.trim())) {
          ensureSpace(12)
          page.drawText('•', { x: ML, y: y + 1, size: 9, font: fontReg, color: black })
          drawWrapped(b, { x: ML + 10, font: fontReg, size: 9.5, color: black, maxW: CONTENT_W - 10, leading: 3 })
        }
        y -= 6
      }
    }

    // ── Projects ──────────────────────────────────────────────────────────────
    const projs = (rd.projects || []).filter(p => p.name)
    if (projs.length) {
      sectionHeading('Projects')
      for (const p of projs) {
        ensureSpace(28)
        page.drawText(p.name, { x: ML, y, size: 10.5, font: fontBold, color: black })
        if (p.link) {
          const lw = fontItal.widthOfTextAtSize(p.link, 8.5)
          page.drawText(p.link, { x: PAGE_W - MR - lw, y, size: 8.5, font: fontItal, color: grey })
        }
        y -= 13
        if (p.techStack) {
          page.drawText(`Tech: ${p.techStack}`, { x: ML, y, size: 9.5, font: fontItal, color: grey })
          y -= 12
        }
        if (p.description) {
          drawWrapped(p.description, { x: ML, font: fontReg, size: 9.5, color: black, maxW: CONTENT_W, leading: 3 })
        }
        y -= 5
      }
    }

    // ── Education ─────────────────────────────────────────────────────────────
    const edus = (rd.education || []).filter(e => e.degree || e.institution)
    if (edus.length) {
      sectionHeading('Education')
      for (const e of edus) {
        ensureSpace(28)
        if (e.degree) {
          page.drawText(e.degree, { x: ML, y, size: 10.5, font: fontBold, color: black })
          if (e.year) {
            const yw = fontReg.widthOfTextAtSize(e.year, 9.5)
            page.drawText(e.year, { x: PAGE_W - MR - yw, y, size: 9.5, font: fontReg, color: midgrey })
          }
          y -= 13
        }
        if (e.institution) {
          const inst = e.cgpa ? `${e.institution}  ·  CGPA: ${e.cgpa}` : e.institution
          page.drawText(inst, { x: ML, y, size: 10, font: fontItal, color: grey })
          y -= 13
        }
        y -= 3
      }
    }

    // ── Certifications ────────────────────────────────────────────────────────
    const certs = (rd.certifications || []).filter(c => c.name)
    if (certs.length) {
      sectionHeading('Certifications')
      for (const c of certs) {
        ensureSpace(16)
        const certLine = [c.name, c.issuer].filter(Boolean).join('  ·  ')
        page.drawText(certLine, { x: ML, y, size: 10, font: fontBold, color: black })
        if (c.year) {
          const yw = fontReg.widthOfTextAtSize(c.year, 9.5)
          page.drawText(c.year, { x: PAGE_W - MR - yw, y, size: 9.5, font: fontReg, color: midgrey })
        }
        y -= 14
      }
    }

    // ── Serialize & send ──────────────────────────────────────────────────────
    const pdfBytes = await pdfDoc.save()
    const safeName = (rd.fullName || 'Resume').replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_')
    const filename  = `${safeName}_CareerCONNECT_Resume.pdf`

    res.set('Content-Type', 'application/pdf')
    res.set('Content-Disposition', `attachment; filename="${filename}"`)
    res.set('Content-Length', pdfBytes.length)
    res.send(Buffer.from(pdfBytes))
  } catch (err) {
    console.error('[PDF Gen]', err)
    res.status(500).json({ message: err.message })
  }
}

// ─── GET /api/users/resume/:fileId — stream PDF to client ────────────────────
exports.downloadResume = async (req, res) => {
  try {
    const bucket = getBucket()
    const fileId = new mongoose.Types.ObjectId(req.params.fileId)

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
