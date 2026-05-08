import api from './api'

export const getConversations = async () => {
  const { data } = await api.get('/messages/conversations')
  return data
}

export const bootstrapConversation = async ({ jobId, applicantId, employerId }) => {
  const { data } = await api.get('/messages/bootstrap', { params: { jobId, applicantId, employerId } })
  return data
}

export const getMessages = async (conversationId) => {
  const { data } = await api.get(`/messages/${conversationId}`)
  return data
}

export const sendMessage = async (payload) => {
  const { data } = await api.post('/messages', payload)
  return data
}

export const getUnreadMessageCount = async () => {
  const { data } = await api.get('/messages/unread-count')
  return data?.count || 0
}

export const markMessageRead = async (id) => {
  const { data } = await api.patch(`/messages/${id}/read`)
  return data
}
