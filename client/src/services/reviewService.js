import api from './api'

export const getEmployerReviews = async (employerId) => {
  const { data } = await api.get(`/reviews/${employerId}`)
  return data
}

export const createReview = async (employerId, reviewData) => {
  const { data } = await api.post(`/reviews/${employerId}`, reviewData)
  return data
}
