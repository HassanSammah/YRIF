import apiClient from './client'
import type { User, Profile, MentorProfile, PartnerProfile, ResearchAssistantProfile, UserStatus, UserRole } from '@/types/user'
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

  // ── Phone OTP ─────────────────────────────────────────────────────────────
  requestPhoneOTP: (phone_number: string) =>
    apiClient.post<{ detail: string }>('/auth/phone/request-otp/', { phone_number }),

  verifyPhoneOTP: (phone_number: string, code: string) =>
    apiClient.post<{ detail: string }>('/auth/phone/verify-otp/', { phone_number, code }),

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
}
