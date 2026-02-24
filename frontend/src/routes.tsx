import { createBrowserRouter, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

// Lazy imports for code splitting
import { lazy, Suspense } from 'react'

const Login = lazy(() => import('@/pages/auth/Login'))
const Register = lazy(() => import('@/pages/auth/Register'))
const PendingApproval = lazy(() => import('@/pages/auth/PendingApproval'))
const Dashboard = lazy(() => import('@/pages/dashboard/Dashboard'))
const Profile = lazy(() => import('@/pages/profile/Profile'))
const ResearchRepository = lazy(() => import('@/pages/research/ResearchRepository'))
const ResearchDetail = lazy(() => import('@/pages/research/ResearchDetail'))
const SubmitResearch = lazy(() => import('@/pages/research/SubmitResearch'))
const MyResearch = lazy(() => import('@/pages/research/MyResearch'))
const EventsList = lazy(() => import('@/pages/events/EventsList'))
const EventDetail = lazy(() => import('@/pages/events/EventDetail'))
const Competitions = lazy(() => import('@/pages/events/Competitions'))
const MyCertificates = lazy(() => import('@/pages/events/MyCertificates'))
const MentorDirectory = lazy(() => import('@/pages/mentorship/MentorDirectory'))
const MyMentorship = lazy(() => import('@/pages/mentorship/MyMentorship'))
const ResourceHub = lazy(() => import('@/pages/resources/ResourceHub'))
const Messages = lazy(() => import('@/pages/messaging/Messages'))
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'))
const UserManagement = lazy(() => import('@/pages/admin/UserManagement'))
const ResearchManagement = lazy(() => import('@/pages/admin/ResearchManagement'))
const EventManagement = lazy(() => import('@/pages/admin/EventManagement'))
const ContentManagement = lazy(() => import('@/pages/admin/ContentManagement'))
const Reports = lazy(() => import('@/pages/admin/Reports'))

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isApproved, user } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isApproved && user?.role !== 'admin') return <Navigate to="/pending-approval" replace />
  return <>{children}</>
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuth()
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

const wrap = (Component: React.ComponentType) => (
  <Suspense fallback={<div>Loading...</div>}>
    <Component />
  </Suspense>
)

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  { path: '/login', element: wrap(Login) },
  { path: '/register', element: wrap(Register) },
  { path: '/pending-approval', element: wrap(PendingApproval) },
  {
    path: '/dashboard',
    element: <RequireAuth>{wrap(Dashboard)}</RequireAuth>,
  },
  {
    path: '/profile',
    element: <RequireAuth>{wrap(Profile)}</RequireAuth>,
  },
  { path: '/research', element: wrap(ResearchRepository) },
  { path: '/research/:id', element: wrap(ResearchDetail) },
  {
    path: '/research/submit',
    element: <RequireAuth>{wrap(SubmitResearch)}</RequireAuth>,
  },
  {
    path: '/research/my',
    element: <RequireAuth>{wrap(MyResearch)}</RequireAuth>,
  },
  { path: '/events', element: wrap(EventsList) },
  { path: '/events/:id', element: wrap(EventDetail) },
  { path: '/competitions', element: wrap(Competitions) },
  {
    path: '/certificates',
    element: <RequireAuth>{wrap(MyCertificates)}</RequireAuth>,
  },
  { path: '/mentors', element: wrap(MentorDirectory) },
  {
    path: '/mentorship',
    element: <RequireAuth>{wrap(MyMentorship)}</RequireAuth>,
  },
  {
    path: '/resources',
    element: <RequireAuth>{wrap(ResourceHub)}</RequireAuth>,
  },
  {
    path: '/messages',
    element: <RequireAuth>{wrap(Messages)}</RequireAuth>,
  },
  // Admin routes
  {
    path: '/admin',
    element: <RequireAdmin>{wrap(AdminDashboard)}</RequireAdmin>,
  },
  {
    path: '/admin/users',
    element: <RequireAdmin>{wrap(UserManagement)}</RequireAdmin>,
  },
  {
    path: '/admin/research',
    element: <RequireAdmin>{wrap(ResearchManagement)}</RequireAdmin>,
  },
  {
    path: '/admin/events',
    element: <RequireAdmin>{wrap(EventManagement)}</RequireAdmin>,
  },
  {
    path: '/admin/content',
    element: <RequireAdmin>{wrap(ContentManagement)}</RequireAdmin>,
  },
  {
    path: '/admin/reports',
    element: <RequireAdmin>{wrap(Reports)}</RequireAdmin>,
  },
])
