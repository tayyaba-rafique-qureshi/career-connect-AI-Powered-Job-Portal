const axios = require('axios')

/**
 * Calls the Python AI microservice to compute a match score
 * between a resume and a job description.
 */
const analyzeMatch = async (resumeText, jobDescription) => {
  try {
    const { data } = await axios.post(`${process.env.AI_SERVICE_URL}/analyze`, {
      resume: resumeText,
      job_description: jobDescription
    })
    return data.score ?? null
  } catch (err) {
    console.error('AI service error:', err.message)
    return null  // graceful fallback — application still saved without score
  }
}

module.exports = { analyzeMatch }
