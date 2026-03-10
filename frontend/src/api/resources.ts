import apiClient from './client'
import type { PaginatedResponse } from '@/types/api'
import type { Resource, Webinar, ResourceType, ResourceWriteData, WebinarWriteData } from '@/types/resources'

export const resourcesApi = {
  // ── Public: resources ────────────────────────────────────────────────────
  listResources: (params?: {
    resource_type?: ResourceType
    search?: string
    tag?: string
    ordering?: string
    page?: number
  }) => apiClient.get<PaginatedResponse<Resource>>('/resources/', { params }),

  getResource: (id: string) =>
    apiClient.get<Resource>(`/resources/${id}/`),

  downloadResource: (id: string) =>
    apiClient.get<{ url: string; title: string }>(`/resources/${id}/download/`),

  // ── Public: webinars ──────────────────────────────────────────────────────
  listWebinars: (params?: { when?: 'upcoming' | 'past'; tag?: string; search?: string }) =>
    apiClient.get<PaginatedResponse<Webinar>>('/resources/webinars/', { params }),

  getWebinar: (id: string) =>
    apiClient.get<Webinar>(`/resources/webinars/${id}/`),

  // ── Admin: resources ──────────────────────────────────────────────────────
  adminListResources: (params?: { resource_type?: string; is_published?: boolean; search?: string; page?: number }) =>
    apiClient.get<PaginatedResponse<Resource>>('/resources/admin/resources/', { params }),

  adminCreateResource: (data: FormData | ResourceWriteData) =>
    apiClient.post<Resource>('/resources/admin/resources/', data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
    }),

  adminUpdateResource: (id: string, data: FormData | Partial<ResourceWriteData>) =>
    apiClient.patch<Resource>(`/resources/admin/resources/${id}/`, data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
    }),

  adminDeleteResource: (id: string) =>
    apiClient.delete(`/resources/admin/resources/${id}/`),

  // ── Admin: webinars ───────────────────────────────────────────────────────
  adminListWebinars: (params?: { is_published?: boolean; search?: string; page?: number }) =>
    apiClient.get<PaginatedResponse<Webinar>>('/resources/admin/webinars/', { params }),

  adminCreateWebinar: (data: WebinarWriteData) =>
    apiClient.post<Webinar>('/resources/admin/webinars/', data),

  adminUpdateWebinar: (id: string, data: Partial<WebinarWriteData>) =>
    apiClient.patch<Webinar>(`/resources/admin/webinars/${id}/`, data),

  adminDeleteWebinar: (id: string) =>
    apiClient.delete(`/resources/admin/webinars/${id}/`),
}
