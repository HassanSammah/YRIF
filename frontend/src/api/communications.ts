import apiClient from './client'
import type { PaginatedResponse } from '@/types/api'
import type { NotificationItem, Conversation, Message, UserSearchResult } from '@/types/messaging'

export interface FAQ {
  id: string
  question: string
  answer: string
  order: number
  is_published: boolean
}

export const communicationsApi = {
  // ── Public ────────────────────────────────────────────────────────────────
  submitContact: (data: { name: string; email: string; subject: string; message: string }) =>
    apiClient.post('/communications/contact/', data),

  getFaqs: () =>
    apiClient.get<FAQ[]>('/communications/faqs/'),

  sendChatMessage: (message: string, chat_id: string) =>
    apiClient.post<{ reply: string }>('/communications/chatbot/', { message, chat_id }),

  // ── Notifications ──────────────────────────────────────────────────────────
  getNotifications: () =>
    apiClient.get<NotificationItem[]>('/communications/notifications/'),

  markAllRead: () =>
    apiClient.post('/communications/notifications/read/'),

  markRead: (id: string) =>
    apiClient.post(`/communications/notifications/${id}/read/`),

  // ── User search (for new conversations) ───────────────────────────────────
  searchUsers: (q: string, role?: string) =>
    apiClient.get<UserSearchResult[]>('/communications/users/search/', { params: { q, role } }),

  // ── Conversations ──────────────────────────────────────────────────────────
  listConversations: () =>
    apiClient.get<PaginatedResponse<Conversation>>('/communications/conversations/'),

  createConversation: (data: { subject?: string; conv_type?: string; participant_ids?: string[] }) =>
    apiClient.post<Conversation>('/communications/conversations/', data),

  getConversation: (id: string) =>
    apiClient.get<Conversation>(`/communications/conversations/${id}/`),

  /** Get or create a peer / research-collab conversation with a specific user. */
  startPeerConversation: (user_id: string, subject?: string, conv_type?: string) =>
    apiClient.post<Conversation>('/communications/conversations/peer/', { user_id, subject, conv_type }),

  /** Get or create the mentorship conversation for a match. */
  startMentorshipConversation: (match_id: string) =>
    apiClient.post<Conversation>('/communications/conversations/mentorship/', { match_id }),

  // ── Messages ───────────────────────────────────────────────────────────────
  listMessages: (convId: string) =>
    apiClient.get<PaginatedResponse<Message> | Message[]>(
      `/communications/conversations/${convId}/messages/`,
      { params: { page_size: 500 } },
    ),

  sendMessage: (convId: string, text: string) =>
    apiClient.post<Message>(`/communications/conversations/${convId}/messages/`, { text }),

  // ── Admin (wired to real backend endpoints; admin UI not yet built) ───────
  adminListFaqs: () =>
    apiClient.get<FAQ[]>('/communications/admin/faqs/'),

  adminCreateFaq: (data: { question: string; answer: string; order?: number; is_published?: boolean }) =>
    apiClient.post<FAQ>('/communications/admin/faqs/', data),

  adminUpdateFaq: (id: string, data: Partial<{ question: string; answer: string; order: number; is_published: boolean }>) =>
    apiClient.patch<FAQ>(`/communications/admin/faqs/${id}/`, data),

  adminDeleteFaq: (id: string) =>
    apiClient.delete(`/communications/admin/faqs/${id}/`),

  adminStartConversation: (user_id: string, subject?: string) =>
    apiClient.post<Conversation>('/communications/admin/conversations/start/', { user_id, subject }),

  adminBroadcast: (data: { subject: string; body: string; role?: string }) =>
    apiClient.post<{ sent: number }>('/communications/admin/broadcast/', data),
}
