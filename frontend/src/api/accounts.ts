import apiClient from './client'
import type { User, Profile } from '@/types/user'
import type { TokenPair } from '@/types/api'

export interface AuthResponse extends TokenPair {
  user: User
}

export const authApi = {
  register: (data: {
    email: string
    password: string
    first_name: string
    last_name: string
    role: string
    phone?: string
  }) => apiClient.post<{ detail: string; user: User }>('/auth/register/', data),

  login: (email: string, password: string) =>
    apiClient.post<AuthResponse>('/auth/login/', { email, password }),

  googleAuth: (credential: string) =>
    apiClient.post<AuthResponse & { is_new: boolean }>('/auth/google/', { credential }),

  logout: (refresh: string) => apiClient.post('/auth/logout/', { refresh }),

  me: () => apiClient.get<User>('/auth/me/'),

  updateProfile: (data: Partial<Profile>) =>
    apiClient.patch<Profile>('/auth/profile/', data),

  requestPhoneOTP: (phone_number: string) =>
    apiClient.post<{ detail: string }>('/auth/phone/request-otp/', { phone_number }),

  verifyPhoneOTP: (phone_number: string, code: string) =>
    apiClient.post<{ detail: string }>('/auth/phone/verify-otp/', { phone_number, code }),

  listUsers: (params?: { role?: string; is_approved?: boolean }) =>
    apiClient.get<User[]>('/auth/users/', { params }),

  approveUser: (id: string) =>
    apiClient.patch(`/auth/users/${id}/approve/`),
}
