import api from './api'

export const fetchJobs = async () => {
  const { data } = await api.get('/jobs')
  return data
}

export const applyToJob = async (jobId, resumeText) => {
  const { data } = await api.post(`/jobs/${jobId}/apply`, { resumeText })
  return data
}
