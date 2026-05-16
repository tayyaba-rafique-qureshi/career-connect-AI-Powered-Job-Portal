const axios = require('axios')

/**
 * Calls the Python AI microservice to compute a match score.
 * The AI service exposes POST /api/ai/match which takes applicant_id + job_id
 * and handles all the heavy lifting (resume fetch, preprocessing, TF-IDF).
 *
 * Fallback: if the AI service is down, returns null gracefully so the
 * application is still saved without a score.
 */
const analyzeMatch = async (resumeText, jobDescription) => {
  try {
    // Legacy endpoint — kept for backward compat with old routes
    const { data } = await axios.post(
      `${process.env.AI_SERVICE_URL}/api/ai/match`,
      { resume: resumeText, job_description: jobDescription },
      { timeout: 15000 }
    )
    // New service returns matchScore (0-100), old returned score (0-1)
    if (data.matchScore !== undefined) return data.matchScore / 100
    if (data.score !== undefined) return data.score
    return null
  } catch (err) {
    console.error('[AI Service] analyzeMatch failed:', err.message)
    return null
  }
}

/**
 * Full AI match using applicant_id + job_id — preferred method.
 * Returns { matchScore, skillsMatched, skillsMissing }
 */
const matchApplicantToJob = async (applicantId, jobId) => {
  try {
    const { data } = await axios.post(
      `${process.env.AI_SERVICE_URL}/api/ai/match`,
      { applicant_id: applicantId, job_id: jobId },
      { timeout: 15000 }
    )
    return {
      matchScore:    data.matchScore   ?? null,
      skillsMatched: data.skillsMatched ?? [],
      skillsMissing: data.skillsMissing ?? []
    }
  } catch (err) {
    // Re-throw HTTP errors from the AI service so callers can inspect the
    // status code and detail message (e.g. 400 "no resume text" for new accounts).
    if (err.response) throw err
    console.error('[AI Service] matchApplicantToJob failed:', err.message)
    return { matchScore: null, skillsMatched: [], skillsMissing: [] }
  }
}

/**
 * Get AI-powered job recommendations for an applicant.
 * Returns array of { job_id, title, company, matchScore }
 */
const getRecommendations = async (applicantId, threshold = 60) => {
  try {
    const { data } = await axios.get(
      `${process.env.AI_SERVICE_URL}/api/ai/recommend/${applicantId}`,
      { params: { threshold }, timeout: 15000 }
    )
    return data.jobs || []
  } catch (err) {
    console.error('[AI Service] getRecommendations failed:', err.message)
    return []
  }
}

module.exports = { analyzeMatch, matchApplicantToJob, getRecommendations }
