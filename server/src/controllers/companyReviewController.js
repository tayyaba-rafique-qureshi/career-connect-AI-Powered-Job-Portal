const CompanyReview = require('../models/CompanyReview')
const Job = require('../models/Job')

// GET /api/company-reviews/companies?q=
// Returns list of companies with avg rating + review count
// Sources: companies from Jobs collection + companies that have reviews
exports.getCompanies = async (req, res) => {
  try {
    const { q } = req.query

    // Get unique companies from jobs
    const jobFilter = { status: 'active' }
    if (q) jobFilter.company = { $regex: q, $options: 'i' }
    const jobCompanies = await Job.distinct('company', jobFilter)

    // Get companies that have reviews
    const reviewFilter = {}
    if (q) reviewFilter.companyName = { $regex: q, $options: 'i' }
    const reviewCompanies = await CompanyReview.distinct('companyName', reviewFilter)

    // Merge unique company names
    const allNames = [...new Set([...jobCompanies, ...reviewCompanies])]

    // Build company objects with stats
    const companies = await Promise.all(allNames.map(async (name) => {
      const reviews = await CompanyReview.find({ companyName: name })
      const reviewCount = reviews.length
      const avgRating = reviewCount > 0
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviewCount
        : 0

      // Get employer profile info from jobs
      const job = await Job.findOne({ company: name, status: 'active' })
        .populate('postedBy', 'employerProfile')
      const ep = job?.postedBy?.employerProfile

      // Compute sub-rating averages
      const breakdown = reviewCount > 0 ? {
        workLifeBalance: avg(reviews, 'workLifeBalance'),
        compensation:    avg(reviews, 'compensation'),
        jobSecurity:     avg(reviews, 'jobSecurity'),
        management:      avg(reviews, 'management'),
        culture:         avg(reviews, 'culture'),
      } : null

      return {
        name,
        avgRating: parseFloat(avgRating.toFixed(1)),
        reviewCount,
        industry:      ep?.companyInfo?.industry || job?.postedBy?.employerProfile?.companyInfo?.industry || null,
        headquarters:  ep?.location?.headquarters || null,
        size:          ep?.companyInfo?.size || null,
        breakdown,
      }
    }))

    // Sort: companies with reviews first, then alphabetically
    companies.sort((a, b) => b.reviewCount - a.reviewCount || a.name.localeCompare(b.name))

    res.json(companies)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/company-reviews/:companyName
exports.getReviews = async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.companyName)
    const reviews = await CompanyReview.find({ companyName: name })
      .sort({ createdAt: -1 })
    res.json(reviews)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// POST /api/company-reviews/:companyName
exports.addReview = async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.companyName)
    const {
      rating, title, body, pros, cons, role, employmentType, recommended,
      workLifeBalance, compensation, jobSecurity, management, culture
    } = req.body

    if (!rating || !title) return res.status(400).json({ message: 'Rating and title are required' })

    const review = await CompanyReview.create({
      companyName: name,
      reviewer: req.user?.id,
      rating, title, body, pros, cons,
      role: role || 'Employee',
      employmentType: employmentType || 'Full-time',
      recommended: !!recommended,
      workLifeBalance, compensation, jobSecurity, management, culture,
    })

    res.status(201).json(review)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ── Helper ────────────────────────────────────────────────────────────────────
function avg(arr, field) {
  const vals = arr.map(r => r[field]).filter(v => v != null && v > 0)
  if (!vals.length) return 0
  return parseFloat((vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1))
}
