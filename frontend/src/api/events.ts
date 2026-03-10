import apiClient from './client'
import type { Event, EventRegistration, Winner, Certificate, JudgeScore } from '@/types/events'
import type { PaginatedResponse } from '@/types/api'

export const eventsApi = {
  // ── Public ─────────────────────────────────────────────────────────────────
  list: (params?: { event_type?: string; search?: string; page?: number }) =>
    apiClient.get<PaginatedResponse<Event>>('/events/', { params }),

  get: (id: string) =>
    apiClient.get<Event>(`/events/${id}/`),

  getWinners: (eventId: string) =>
    apiClient.get<Winner[]>(`/events/${eventId}/winners/`),

  // ── User ───────────────────────────────────────────────────────────────────
  register: (eventId: string, data?: { research_submission?: string }) =>
    apiClient.post<EventRegistration>(`/events/${eventId}/register/`, data ?? {}),

  unregister: (eventId: string) =>
    apiClient.delete(`/events/${eventId}/unregister/`),

  myRegistrations: () =>
    apiClient.get<PaginatedResponse<EventRegistration>>('/events/my/'),

  myCertificates: () =>
    apiClient.get<Certificate[]>('/events/certificates/'),

  downloadCertificate: (registrationId: string) =>
    apiClient.get(`/events/registrations/${registrationId}/certificate/`, {
      responseType: 'blob',
    }),

  // ── Judge ──────────────────────────────────────────────────────────────────
  score: (registrationId: string, data: { score: number; comments: string }) =>
    apiClient.post<JudgeScore>(`/events/registrations/${registrationId}/score/`, data),

  // ── Admin ──────────────────────────────────────────────────────────────────
  adminList: (params?: { event_type?: string; is_published?: boolean; search?: string; page?: number }) =>
    apiClient.get<PaginatedResponse<Event>>('/events/admin/', { params }),

  create: (data: Partial<Event>) =>
    apiClient.post<Event>('/events/admin/create/', data),

  update: (id: string, data: Partial<Event>) =>
    apiClient.patch<Event>(`/events/admin/${id}/`, data),

  delete: (id: string) =>
    apiClient.delete(`/events/admin/${id}/`),

  publish: (id: string, publish = true) =>
    apiClient.post<Event>(`/events/admin/${id}/publish/`, { publish }),

  getRegistrations: (eventId: string, params?: { page?: number }) =>
    apiClient.get<PaginatedResponse<EventRegistration>>(
      `/events/admin/${eventId}/registrations/`, { params }
    ),

  updateRegistrationStatus: (registrationId: string, status: string) =>
    apiClient.patch<EventRegistration>(
      `/events/admin/registrations/${registrationId}/status/`, { status }
    ),

  publishWinners: (eventId: string, winners: { registration_id: string; rank: string }[]) =>
    apiClient.post<Winner[]>(`/events/admin/${eventId}/winners/`, { winners }),
}
