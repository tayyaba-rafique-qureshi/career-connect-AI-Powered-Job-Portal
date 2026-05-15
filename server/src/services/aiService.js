/**
 * server/src/services/aiService.js
 * ----------------------------------
 * HTTP client for the CareerConnect Python AI microservice.
 *
 * All functions:
 *   - Use a 10-second timeout
 *   - Retry once after 1 second on failure before giving up
 *   - Return fallback data (never throw) so the app keeps working
 *     when the AI service is offline
 *   - Log every call and every failure
 *
 * Base URL is read from process.env.AI_SERVICE_URL, defaulting to
 * http://localhost:8000 so local dev works without any .env change.
 */

const axios = require('axios')

const AI_URL = () => (process.env.AI_SERVICE_URL || 'http://localhost:8000').replace(/\/$/, '')

const TIMEOUT_MS = 10_000   // 10 seconds
const RETRY_DELAY_MS = 1_000 // 1 second before retry

/**
 * Internal helper: call the AI service with one automatic retry.
 *
 * @param {Function} requestFn  — async () => axios response
 * @param {string}   label      — short description for log messages
 * @returns {any|null}          — response data, or null on failure
 */
async function _callWithRetry(requestFn, label) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await requestFn()
      return response.data
    } catch (err) {
      const isLastAttempt = attempt === 2
      if (isLastAttempt) {
        console.warn(`[AI Service] ${label} failed after ${attempt} attempt(s): ${err.message}`)
        return null
      }
      console.warn(`[AI Service] ${label} attempt ${attempt} failed (${err.message}) — retrying in ${RETRY_DELAY_MS}ms`)
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS))
    }
  }
  return null
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * POST /api/ai/match
 * Full hybrid match score between an applicant and a job.
 *
 * @param {string} applicantId  — MongoDB ObjectId string
 * @param {string} jobId        — MongoDB ObjectId string
 * @returns {{ matchScore: number|null, skillsMatched: string[], skillsMissing: string[] }}
 */
async function analyzeMatch(applicantId, jobId) {
  console.log(`[AI Service] calling match for applicant ${applicantId} job ${jobId}`)

  const data = await _callWithRetry(
    () => axios.post(
      `${AI_URL()}/api/ai/match`,
      { applicant_id: applicantId, job_id: jobId },
      { timeout: TIMEOUT_MS }
    ),
    `match applicant=${applicantId} job=${jobId}`
  )

  if (!data) {
    return { matchScore: null, skillsMatched: [], skillsMissing: [] }
  }

  return {
    matchScore:    data.matchScore    ?? null,
    skillsMatched: data.skillsMatched ?? [],
    skillsMissing: data.skillsMissing ?? [],
  }
}

/**
 * GET /api/ai/recommend/:applicantId
 * Top job recommendations for an applicant (TF-IDF based, fast).
 *
 * @param {string} applicantId
 * @param {number} [threshold=60]
 * @returns {Array}  — array of { job_id, title, company, matchScore }
 */
async function getRecommendations(applicantId, threshold = 60) {
  console.log(`[AI Service] calling recommendations for applicant ${applicantId}`)

  const data = await _callWithRetry(
    () => axios.get(
      `${AI_URL()}/api/ai/recommend/${applicantId}`,
      { params: { threshold }, timeout: TIMEOUT_MS }
    ),
    `recommendations applicant=${applicantId}`
  )

  return data?.jobs ?? []
}

/**
 * POST /api/ai/extract-resume
 * Trigger PDF text extraction for an applicant's stored resume.
 *
 * @param {string} applicantId
 * @returns {{ success: boolean, charCount: number, message: string }|null}
 */
async function extractResume(applicantId) {
  console.log(`[AI Service] calling extract-resume for applicant ${applicantId}`)

  const data = await _callWithRetry(
    () => axios.post(
      `${AI_URL()}/api/ai/extract-resume`,
      { applicant_id: applicantId },
      { timeout: TIMEOUT_MS }
    ),
    `extract-resume applicant=${applicantId}`
  )

  return data ?? null
}

/**
 * GET /api/ai/career-advice/:applicantId/:jobId
 * Personalised career path advice for an applicant relative to a job.
 *
 * @param {string} applicantId
 * @param {string} jobId
 * @returns {object|null}  — { immediateActions, shortTermGoals, careerPathSuggestion, estimatedImprovementScore }
 */
async function getCareerAdvice(applicantId, jobId) {
  console.log(`[AI Service] calling career-advice for applicant ${applicantId} job ${jobId}`)

  const data = await _callWithRetry(
    () => axios.get(
      `${AI_URL()}/api/ai/career-advice/${applicantId}/${jobId}`,
      { timeout: TIMEOUT_MS }
    ),
    `career-advice applicant=${applicantId} job=${jobId}`
  )

  return data ?? null
}

/**
 * POST /api/ai/astar-search
 * A* graph search over all active jobs for an applicant.
 *
 * @param {string} applicantId
 * @param {number} [threshold=90]
 * @returns {object|null}  — full A* result with explorationPath, efficiency, etc.
 */
async function runAstarSearch(applicantId, threshold = 90) {
  console.log(`[AI Service] calling astar-search for applicant ${applicantId} threshold=${threshold}`)

  const data = await _callWithRetry(
    () => axios.post(
      `${AI_URL()}/api/ai/astar-search`,
      { applicant_id: applicantId, threshold },
      { timeout: TIMEOUT_MS }
    ),
    `astar-search applicant=${applicantId}`
  )

  return data ?? null
}

module.exports = {
  analyzeMatch,
  getRecommendations,
  extractResume,
  getCareerAdvice,
  runAstarSearch,
}
