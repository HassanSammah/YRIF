import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { useAuth } from '@/hooks/useAuth'
import AppLayout from '@/components/layout/AppLayout'
import { SkeletonPage } from '@/components/common/Skeleton'
import ErrorBoundary from '@/components/common/ErrorBoundary'

// ── Lazy page imports ─────────────────────────────────────────────────────────

const Login              = lazy(() => import('@/pages/auth/Login'))
const Register           = lazy(() => import('@/pages/auth/Register'))
const PendingApproval    = lazy(() => import('@/pages/auth/PendingApproval'))
const VerifyEmail        = lazy(() => import('@/pages/auth/VerifyEmail'))
const BriqAuth           = lazy(() => import('@/pages/auth/BriqAuth'))
const Dashboard          = lazy(() => import('@/pages/dashboard/Dashboard'))
const Profile            = lazy(() => import('@/pages/profile/Profile'))
const ResearchRepository = lazy(() => import('@/pages/research/ResearchRepository'))
const ResearchDetail     = lazy(() => import('@/pages/research/ResearchDetail'))
const SubmitResearch     = lazy(() => import('@/pages/research/SubmitResearch'))
const MyResearch         = lazy(() => import('@/pages/research/MyResearch'))
const EventsList         = lazy(() => import('@/pages/events/EventsList'))
const EventDetail        = lazy(() => import('@/pages/events/EventDetail'))
const Competitions       = lazy(() => import('@/pages/events/Competitions'))
const MyCertificates     = lazy(() => import('@/pages/events/MyCertificates'))
const MentorDirectory    = lazy(() => import('@/pages/mentorship/MentorDirectory'))
const MyMentorship       = lazy(() => import('@/pages/mentorship/MyMentorship'))
const ResourceHub        = lazy(() => import('@/pages/resources/ResourceHub'))
const Messages           = lazy(() => import('@/pages/messaging/Messages'))
const Contact            = lazy(() => import('@/pages/contact/Contact'))
const Notifications      = lazy(() => import('@/pages/notifications/Notifications'))
const AdminDashboard     = lazy(() => import('@/pages/admin/AdminDashboard'))
const UserManagement     = lazy(() => import('@/pages/admin/UserManagement'))
const ResearchManagement = lazy(() => import('@/pages/admin/ResearchManagement'))
const EventManagement    = lazy(() => import('@/pages/admin/EventManagement'))
const ContentManagement  = lazy(() => import('@/pages/admin/ContentManagement'))
const Reports            = lazy(() => import('@/pages/admin/Reports'))
const MentorshipMgmt     = lazy(() => import('@/pages/admin/MentorshipManagement'))

// ── Guards ────────────────────────────────────────────────────────────────────

function RequireAuth() {
  const { isAuthenticated, user, isAdmin } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.status === 'suspended' || user?.status === 'rejected') {
    return <Navigate to="/login" replace />
  }
  if (user?.status === 'pending_email') {
    return <Navigate to="/auth/verify-email" replace />
  }
  if (user?.status === 'pending_approval' && !isAdmin) {
    return <Navigate to="/pending-approval" replace />
  }
  return <AppLayout />
}

function RequireAdmin() {
  const { isAdmin } = useAuth()
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  return <Outlet />
}

// ── Page wrapper ──────────────────────────────────────────────────────────────

function wrap(Component: React.ComponentType) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<SkeletonPage />}>
        <Component />
      </Suspense>
    </ErrorBoundary>
  )
}

// ── Router ────────────────────────────────────────────────────────────────────

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/dashboard" replace /> },

  // Public (no layout shell)
  { path: '/login',              element: wrap(Login) },
  { path: '/register',           element: wrap(Register) },
  { path: '/pending-approval',   element: wrap(PendingApproval) },
  { path: '/auth/verify-email',  element: wrap(VerifyEmail) },
  { path: '/auth/briq',          element: wrap(BriqAuth) },

  // Protected — AppLayout shell
  {
    element: <RequireAuth />,
    children: [
      { path: '/dashboard',       element: wrap(Dashboard) },
      { path: '/profile',         element: wrap(Profile) },
      { path: '/research',        element: wrap(ResearchRepository) },
      { path: '/research/submit', element: wrap(SubmitResearch) },
      { path: '/research/my',     element: wrap(MyResearch) },
      { path: '/research/:id',    element: wrap(ResearchDetail) },
      { path: '/events',          element: wrap(EventsList) },
      { path: '/events/:id',      element: wrap(EventDetail) },
      { path: '/competitions',    element: wrap(Competitions) },
      { path: '/certificates',    element: wrap(MyCertificates) },
      { path: '/mentors',         element: wrap(MentorDirectory) },
      { path: '/mentorship',      element: wrap(MyMentorship) },
      { path: '/resources',       element: wrap(ResourceHub) },
      { path: '/messages',        element: wrap(Messages) },
      { path: '/notifications',   element: wrap(Notifications) },
      { path: '/contact',         element: wrap(Contact) },

      // Admin-only (still inside AppLayout shell)
      {
        element: <RequireAdmin />,
        children: [
          { path: '/admin',            element: wrap(AdminDashboard) },
          { path: '/admin/users',      element: wrap(UserManagement) },
          { path: '/admin/research',   element: wrap(ResearchManagement) },
          { path: '/admin/events',     element: wrap(EventManagement) },
          { path: '/admin/content',    element: wrap(ContentManagement) },
          { path: '/admin/reports',    element: wrap(Reports) },
          { path: '/admin/mentorship', element: wrap(MentorshipMgmt) },
        ],
      },
    ],
  },
])
