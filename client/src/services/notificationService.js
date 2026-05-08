import api from './api'

export const getNotifications = async () => {
  const { data } = await api.get('/notifications')
  return data
}

export const markRead = async (id) => {
  await api.patch(`/notifications/${id}/read`)
}

export const markAllRead = async () => {
  await api.patch('/notifications/read-all')
}
