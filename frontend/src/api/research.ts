import apiClient from './client'
import type { Research, ResearchReview } from '@/types/research'
import type { PaginatedResponse } from '@/types/api'

export const researchApi = {
  list: (params?: { category?: string; search?: string; page?: number }) =>
    apiClient.get<PaginatedResponse<Research>>('/research/', { params }),

  myResearch: () =>
    apiClient.get<PaginatedResponse<Research>>('/research/my/'),

  get: (id: string) =>
    apiClient.get<Research>(`/research/${id}/`),

  submit: (formData: FormData) =>
    apiClient.post<Research>('/research/submit/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  review: (id: string, data: Pick<ResearchReview, 'comments' | 'decision'>) =>
    apiClient.post<ResearchReview>(`/research/${id}/review/`, data),

  getDownloadUrl: (id: string) =>
    apiClient.get<{ document_url: string }>(`/research/${id}/download/`),
}
