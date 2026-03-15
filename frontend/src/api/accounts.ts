import apiClient from './client'
import type { User, Profile, MentorProfile, PartnerProfile, ResearchAssistantProfile, UserStatus, UserRole, DeletionRequest } from '@/types/user'
import type { TokenPair, PaginatedResponse } from '@/types/api'

export interface AuthResponse extends TokenPair {
  user: User
}

export const authApi = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  register: (data: {
    email: string
    password: string
    first_name: string
    last_name: string
    role: UserRole
    phone?: string
  }) => apiClient.post<{ detail: string; user: User }>('/auth/register/', data),

  login: (email: string, password: string) =>
    apiClient.post<AuthResponse>('/auth/login/', { email, password }),

  googleAuth: (credential: string) =>
    apiClient.post<AuthResponse & { is_new: boolean }>('/auth/google/', { credential }),

  logout: (refresh: string) => apiClient.post('/auth/logout/', { refresh }),

  // ── Email verification ────────────────────────────────────────────────────
  sendEmailOTP: (email: string) =>
    apiClient.post<{ detail: string }>('/auth/verify-email/send/', { email }),

  verifyEmail: (email: string, code: string) =>
    apiClient.post<AuthResponse>('/auth/verify-email/', { email, code }),

  // ── BRIQ Auth (phone-based login/signup) ──────────────────────────────────
  briqAuthRequest: (phone_number: string) =>
    apiClient.post<{ detail: string; otp_id: string }>('/auth/briq/request/', { phone_number }),

  briqAuthVerify: (phone_number: string, otp_id: string, code: string) =>
    apiClient.post<
      | (AuthResponse & { needs_registration?: false })
      | { needs_registration: true; verify_token: string }
    >('/auth/briq/verify/', { phone_number, otp_id, code }),

  briqAuthComplete: (data: {
    phone_number: string
    verify_token: string
    first_name: string
    last_name: string
    email: string
    password: string
    role: string
  }) => apiClient.post<AuthResponse>('/auth/briq/complete/', data),

  // ── Phone OTP ─────────────────────────────────────────────────────────────
  requestPhoneOTP: (phone_number: string) =>
    apiClient.post<{ detail: string; otp_id: string }>('/auth/phone/request-otp/', { phone_number }),

  verifyPhoneOTP: (phone_number: string, otp_id: string, code: string) =>
    apiClient.post<{ detail: string }>('/auth/phone/verify-otp/', { phone_number, otp_id, code }),

  // ── Current user ──────────────────────────────────────────────────────────
  me: () => apiClient.get<User>('/auth/me/'),

  // ── Profile ───────────────────────────────────────────────────────────────
  getProfile: () => apiClient.get<Profile>('/auth/profile/'),
  updateProfile: (data: Partial<Profile>) => apiClient.patch<Profile>('/auth/profile/', data),

  getMentorProfile: () => apiClient.get<MentorProfile>('/auth/profile/mentor/'),
  updateMentorProfile: (data: Partial<MentorProfile>) =>
    apiClient.patch<MentorProfile>('/auth/profile/mentor/', data),

  getPartnerProfile: () => apiClient.get<PartnerProfile>('/auth/profile/partner/'),
  updatePartnerProfile: (data: Partial<PartnerProfile>) =>
    apiClient.patch<PartnerProfile>('/auth/profile/partner/', data),

  getAssistantProfile: () => apiClient.get<ResearchAssistantProfile>('/auth/profile/assistant/'),
  updateAssistantProfile: (data: Partial<ResearchAssistantProfile>) =>
    apiClient.patch<ResearchAssistantProfile>('/auth/profile/assistant/', data),

  // ── Admin: users ──────────────────────────────────────────────────────────
  listUsers: (params?: { role?: string; status?: string; search?: string; page?: number }) =>
    apiClient.get<PaginatedResponse<User>>('/auth/users/', { params }),

  getUser: (id: string) => apiClient.get<User>(`/auth/users/${id}/`),

  updateUserStatus: (id: string, status: UserStatus, reason?: string) =>
    apiClient.patch<{ detail: string; user: User }>(`/auth/users/${id}/status/`, { status, reason }),

  updateUserRole: (id: string, role: UserRole) =>
    apiClient.patch<{ detail: string; user: User }>(`/auth/users/${id}/role/`, { role }),

  updateUser: (id: string, data: {
    first_name?: string; last_name?: string; email?: string;
    role?: string; status?: string; is_active?: boolean;
    profile?: { bio?: string; phone?: string; institution?: string; region?: string; education_level?: string; skills?: string; research_interests?: string; achievements?: string }
  }) => apiClient.patch<User>(`/auth/users/${id}/`, data),

  deleteUser: (id: string) => apiClient.delete(`/auth/users/${id}/`),

  // ── Email change ──────────────────────────────────────────────────────────
  changeEmail: (new_email: string) =>
    apiClient.post<{ detail: string }>('/auth/change-email/', { new_email }),

  confirmEmailChange: (new_email: string, code: string) =>
    apiClient.post<{ detail: string; user: User }>('/auth/change-email/confirm/', { new_email, code }),

  // ── Account deletion requests ─────────────────────────────────────────────
  requestDeletion: (reason?: string) =>
    apiClient.post<DeletionRequest>('/auth/deletion-request/', { reason: reason ?? '' }),

  listDeletionRequests: (params?: { page?: number }) =>
    apiClient.get<PaginatedResponse<DeletionRequest>>('/auth/deletion-requests/', { params }),

  approveDeletion: (id: string) =>
    apiClient.post<void>(`/auth/deletion-requests/${id}/approve/`, {}),

  rejectDeletion: (id: string) =>
    apiClient.post<DeletionRequest>(`/auth/deletion-requests/${id}/reject/`, {}),
}
