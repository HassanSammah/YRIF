import apiClient from './client'
import type { User, Profile } from '@/types/user'
import type { TokenPair } from '@/types/api'

export const authApi = {
  register: (data: { email: string; password: string; first_name: string; last_name: string; role: string }) =>
    apiClient.post<User>('/auth/register/', data),

  login: (email: string, password: string) =>
    apiClient.post<TokenPair>('/auth/token/', { email, password }),

  logout: () => apiClient.post('/auth/logout/'),

  me: () => apiClient.get<User>('/auth/me/'),

  updateProfile: (data: Partial<Profile>) =>
    apiClient.patch<Profile>('/auth/profile/', data),

  listUsers: (params?: { role?: string; is_approved?: boolean }) =>
    apiClient.get<User[]>('/auth/users/', { params }),

  approveUser: (id: string) =>
    apiClient.patch(`/auth/users/${id}/approve/`),
}
