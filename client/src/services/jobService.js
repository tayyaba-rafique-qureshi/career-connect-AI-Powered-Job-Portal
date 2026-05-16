import api from './api'

export const fetchJobs = async (params = {}) => {
  const { data } = await api.get('/jobs', { params })
  return data
}

export const fetchJobById = async (id) => {
  const { data } = await api.get(`/jobs/${id}`)
  return data
}

// GET /api/jobs/search?title=&location=
export const searchJobs = async ({ title = '', location = '' } = {}) => {
  const { data } = await api.get('/jobs/search', { params: { title, location } })
  return data
}

export const getAIMatch = async (jobId) => {
  const { data } = await api.post('/ai/match-resume-job', { jobId })
  return data
}

// GET /api/ai/recommend
export const getRecommendedJobs = async () => {
  const { data } = await api.get('/ai/recommend')
  return data.jobs || []
}

export const reportJob = async (jobId, reason, description = '') => {
  const { data } = await api.post(`/jobs/${jobId}/report`, { reason, description })
  return data
}
