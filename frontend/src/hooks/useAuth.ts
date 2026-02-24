import { useAuthStore } from '@/store/auth'
import type { UserRole } from '@/types/user'

export function useAuth() {
  const { user, isAuthenticated, login, logout, fetchMe } = useAuthStore()

  const hasRole = (...roles: UserRole[]) =>
    !!user && roles.includes(user.role)

  const isAdmin = hasRole('admin', 'staff', 'program_manager')
  const isContentManager = hasRole('admin', 'staff', 'program_manager', 'content_manager')
  const isApproved = !!user?.is_approved

  return { user, isAuthenticated, isAdmin, isContentManager, isApproved, login, logout, fetchMe }
}
