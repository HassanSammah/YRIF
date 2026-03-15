import apiClient from './client'
import type { PaginatedResponse } from '@/types/api'
import type {
  MentorListing,
  PartnerListing,
  MentorshipRequest,
  MentorshipMatch,
  MentorFeedback,
  MentorshipMatchStatus,
  RAListing,
  ResearchCollabRequest,
  ResearchCollaboration,
  CollaborationStatus,
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

  // Mentor self-service accept / decline
  acceptRequest: (id: string) =>
    apiClient.post<MentorshipMatch>(`/mentorship/requests/${id}/accept/`),

  declineRequest: (id: string) =>
    apiClient.post<{ detail: string }>(`/mentorship/requests/${id}/decline/`),

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

  // ── Research assistant directory ──────────────────────────────────────────
  listRAs: (params?: { search?: string; page?: number }) =>
    apiClient.get<PaginatedResponse<RAListing>>('/mentorship/research-assistants/', { params }),

  getRA: (id: string) =>
    apiClient.get<RAListing>(`/mentorship/research-assistants/${id}/`),

  // ── Collaboration requests ─────────────────────────────────────────────────
  listCollabRequests: (params?: { page?: number }) =>
    apiClient.get<PaginatedResponse<ResearchCollabRequest>>('/mentorship/collab-requests/', { params }),

  createCollabRequest: (data: { topic: string; description?: string; research_assistant?: string }) =>
    apiClient.post<ResearchCollabRequest>('/mentorship/collab-requests/', data),

  acceptCollabRequest: (id: string) =>
    apiClient.post<ResearchCollaboration>(`/mentorship/collab-requests/${id}/accept/`),

  declineCollabRequest: (id: string) =>
    apiClient.post<{ detail: string }>(`/mentorship/collab-requests/${id}/decline/`),

  // ── Collaborations ─────────────────────────────────────────────────────────
  listCollaborations: (params?: { status?: CollaborationStatus; page?: number }) =>
    apiClient.get<PaginatedResponse<ResearchCollaboration>>('/mentorship/collaborations/', { params }),

  updateCollaboration: (id: string, data: { status?: CollaborationStatus; notes?: string }) =>
    apiClient.patch<ResearchCollaboration>(`/mentorship/collaborations/${id}/`, data),
}
