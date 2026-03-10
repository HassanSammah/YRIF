import apiClient from './client'
import type { PaginatedResponse } from '@/types/api'
import type {
  MentorListing,
  PartnerListing,
  MentorshipRequest,
  MentorshipMatch,
  MentorFeedback,
  MentorshipMatchStatus,
} from '@/types/mentorship'

export const mentorshipApi = {
  // ── Public directory ──────────────────────────────────────────────────────
  listMentors: (params?: { search?: string; page?: number }) =>
    apiClient.get<PaginatedResponse<MentorListing>>('/mentorship/mentors/', { params }),

  getMentor: (id: string) =>
    apiClient.get<MentorListing>(`/mentorship/mentors/${id}/`),

  listPartners: (params?: { search?: string; page?: number }) =>
    apiClient.get<PaginatedResponse<PartnerListing>>('/mentorship/partners/', { params }),

  // ── Mentorship requests ───────────────────────────────────────────────────
  listRequests: (params?: { page?: number }) =>
    apiClient.get<PaginatedResponse<MentorshipRequest>>('/mentorship/requests/', { params }),

  createRequest: (data: { topic: string; message?: string; preferred_mentor?: string }) =>
    apiClient.post<MentorshipRequest>('/mentorship/requests/', data),

  // Admin
  updateRequestStatus: (id: string, status: 'approved' | 'declined') =>
    apiClient.patch<MentorshipRequest>(`/mentorship/requests/${id}/`, { status }),

  createMatch: (requestId: string, mentorId: string) =>
    apiClient.post<MentorshipMatch>(`/mentorship/requests/${requestId}/match/`, {
      mentor_id: mentorId,
    }),

  // ── Mentorship matches ────────────────────────────────────────────────────
  listMatches: (params?: { status?: MentorshipMatchStatus; page?: number }) =>
    apiClient.get<PaginatedResponse<MentorshipMatch>>('/mentorship/matches/', { params }),

  getMatch: (id: string) =>
    apiClient.get<MentorshipMatch>(`/mentorship/matches/${id}/`),

  updateMatch: (id: string, data: { status?: MentorshipMatchStatus; notes?: string }) =>
    apiClient.patch<MentorshipMatch>(`/mentorship/matches/${id}/`, data),

  // ── Feedback ──────────────────────────────────────────────────────────────
  submitFeedback: (matchId: string, data: { feedback_text: string; rating?: number }) =>
    apiClient.post<MentorFeedback>(`/mentorship/matches/${matchId}/feedback/`, data),

  listFeedback: (matchId: string) =>
    apiClient.get<MentorFeedback[]>(`/mentorship/matches/${matchId}/feedback/list/`),
}
