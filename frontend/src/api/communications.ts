import apiClient from './client'

export const communicationsApi = {
  submitContact: (data: { name: string; email: string; subject: string; message: string }) =>
    apiClient.post('/communications/contact/', data),

  getFaqs: () =>
    apiClient.get('/communications/faqs/'),

  getNotifications: () =>
    apiClient.get('/communications/notifications/'),

  sendChatMessage: (message: string, chat_id: string) =>
    apiClient.post('/communications/chatbot/', { message, chat_id }),
}
