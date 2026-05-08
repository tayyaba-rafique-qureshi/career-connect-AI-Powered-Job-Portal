import api from './api'

export const applyToJob = async (jobId, coverLetter = '') => {
  const { data } = await api.post(`/applications/${jobId}`, { coverLetter })
  return data
}

export const getMyApplications = async (status = '') => {
  const params = status ? { status } : {}
  const { data } = await api.get('/applications/me', { params })
  return data
}

export const checkApplied = async (jobId) => {
  const { data } = await api.get(`/applications/check/${jobId}`)
  return data
}

export const archiveApplication = async (id) => {
  const { data } = await api.post(`/applications/${id}/archive`)
  return data
}

export const unarchiveApplication = async (id) => {
  const { data } = await api.post(`/applications/${id}/unarchive`)
  return data
}

export const getSavedJobs = async () => {
  const { data } = await api.get('/saved-jobs')
  return data
}

export const getSavedJobIds = async () => {
  const { data } = await api.get('/saved-jobs/ids')
  return data
}

export const saveJob = async (jobId) => {
  const { data } = await api.post(`/saved-jobs/${jobId}`)
  return data
}

export const unsaveJob = async (jobId) => {
  const { data } = await api.delete(`/saved-jobs/${jobId}`)
  return data
}

export const dislikeJob = async (jobId) => {
  const { data } = await api.post(`/applications/dislike/${jobId}`)
  return data
}

export const undislikeJob = async (jobId) => {
  const { data } = await api.delete(`/applications/dislike/${jobId}`)
  return data
}

export const getDislikedJobIds = async () => {
  const { data } = await api.get('/applications/disliked-ids')
  return data
}
