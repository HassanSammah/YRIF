import apiClient from './client'
import type { Event, EventRegistration } from '@/types/events'
import type { PaginatedResponse } from '@/types/api'

export const eventsApi = {
  list: (params?: { event_type?: string; search?: string }) =>
    apiClient.get<PaginatedResponse<Event>>('/events/', { params }),

  get: (id: string) =>
    apiClient.get<Event>(`/events/${id}/`),

  register: (eventId: string, data?: { research_submission?: string }) =>
    apiClient.post<EventRegistration>(`/events/${eventId}/register/`, data),

  downloadCertificate: (registrationId: string) =>
    apiClient.get(`/events/${registrationId}/certificate/`, { responseType: 'blob' }),

  // Admin
  create: (data: Partial<Event>) =>
    apiClient.post<Event>('/events/admin/create/', data),

  update: (id: string, data: Partial<Event>) =>
    apiClient.patch<Event>(`/events/admin/${id}/`, data),

  scoreEntry: (registrationId: string, data: { score: number; comments: string }) =>
    apiClient.post(`/events/${registrationId}/scores/`, data),
}
