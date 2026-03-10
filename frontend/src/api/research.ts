import apiClient from './client'
import type { Research, ResearchReview, ReviewAssignment } from '@/types/research'
import type { PaginatedResponse } from '@/types/api'

export const researchApi = {
  // ── Public ─────────────────────────────────────────────────────────────────
  list: (params?: { category?: string; search?: string; page?: number }) =>
    apiClient.get<PaginatedResponse<Research>>('/research/', { params }),

  get: (id: string) =>
    apiClient.get<Research>(`/research/${id}/`),

  getDownloadUrl: (id: string) =>
    apiClient.get<{ document_url: string }>(`/research/${id}/download/`),

  // ── Author ─────────────────────────────────────────────────────────────────
  myResearch: () =>
    apiClient.get<PaginatedResponse<Research>>('/research/my/'),

  createDraft: (formData: FormData) =>
    apiClient.post<Research>('/research/create/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  updateDraft: (id: string, formData: FormData) =>
    apiClient.patch<Research>(`/research/${id}/update/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  submitDraft: (id: string) =>
    apiClient.post<Research>(`/research/${id}/submit/`, {}),

  // ── Admin ──────────────────────────────────────────────────────────────────
  adminList: (params?: { category?: string; status?: string; search?: string; page?: number }) =>
    apiClient.get<PaginatedResponse<Research>>('/research/admin/', { params }),

  assignReviewer: (id: string, reviewerId: string) =>
    apiClient.post<ReviewAssignment>(`/research/${id}/assign-reviewer/`, { reviewer_id: reviewerId }),

  addComment: (id: string, data: { comments: string; decision: string }) =>
    apiClient.post<ResearchReview>(`/research/${id}/comment/`, data),

  decide: (id: string, data: { decision: 'approve' | 'reject'; reason?: string }) =>
    apiClient.post<Research>(`/research/${id}/decide/`, data),

  publish: (id: string) =>
    apiClient.post<Research>(`/research/${id}/publish/`, {}),
}
