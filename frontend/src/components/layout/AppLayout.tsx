import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useQuery } from 'react-query'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { communicationsApi } from '@/api/communications'

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/profile': 'My Profile',
  '/research': 'Research Repository',
  '/research/submit': 'Submit Research',
  '/research/my': 'My Submissions',
  '/events': 'Events',
  '/competitions': 'Competitions',
  '/certificates': 'My Certificates',
  '/mentors': 'Mentor Directory',
  '/mentorship': 'My Mentorship',
  '/research-assistants': 'Research Assistant Directory',
  '/resources': 'Learning Hub',
  '/messages': 'Messages',
  '/notifications': 'Notifications',
  '/contact': 'Contact Us',
  '/admin': 'Admin Dashboard',
  '/admin/users': 'User Management',
  '/admin/research': 'Research Management',
  '/admin/events': 'Event Management',
  '/admin/content': 'Content Management',
  '/admin/reports': 'Reports & Exports',
  '/admin/mentorship': 'Mentorship Management',
}

export default function AppLayout() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  // Unread notification count
  const { data: notifs } = useQuery(
    'notifications-count',
    () => communicationsApi.getNotifications().then((r) => r.data),
    { refetchInterval: 30_000, retry: 1 },
  )
  const unreadCount = Array.isArray(notifs)
    ? notifs.filter((n) => !n.is_read).length
    : 0

  const title = ROUTE_TITLES[location.pathname]

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-cream">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        notifCount={unreadCount}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar
          onMenuClick={() => setSidebarOpen(true)}
          notifCount={unreadCount}
          title={title}
        />

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
