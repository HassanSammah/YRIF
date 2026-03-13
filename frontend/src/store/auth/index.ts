import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types/user'
import { authApi } from '@/api/accounts'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  googleLogin: (credential: string) => Promise<{ is_new: boolean }>
  briqLogin: (accessToken: string, refreshToken: string, user: User) => Promise<void>
  logout: () => Promise<void>
  fetchMe: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const { data } = await authApi.login(email, password)
        localStorage.setItem('access_token', data.access)
        localStorage.setItem('refresh_token', data.refresh)
        set({ accessToken: data.access, refreshToken: data.refresh, isAuthenticated: true, user: data.user })
      },

      briqLogin: async (accessToken, refreshToken, user) => {
        localStorage.setItem('access_token', accessToken)
        localStorage.setItem('refresh_token', refreshToken)
        set({ accessToken, refreshToken, isAuthenticated: true, user })
      },

      googleLogin: async (credential) => {
        const { data } = await authApi.googleAuth(credential)
        localStorage.setItem('access_token', data.access)
        localStorage.setItem('refresh_token', data.refresh)
        set({ accessToken: data.access, refreshToken: data.refresh, isAuthenticated: true, user: data.user })
        return { is_new: data.is_new }
      },

      logout: async () => {
        const refresh = get().refreshToken
        if (refresh) {
          try {
            await authApi.logout(refresh)
          } catch {
            // proceed with local logout even if server-side blacklist fails
          }
        }
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
      },

      fetchMe: async () => {
        const { data } = await authApi.me()
        set({ user: data })
      },
    }),
    { name: 'yrif-auth', partialize: (s) => ({ accessToken: s.accessToken, refreshToken: s.refreshToken }) }
  )
)
