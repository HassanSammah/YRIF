import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, BookOpen, Send, FolderOpen, CalendarDays, Trophy,
  Award, Users2, Heart, Library, MessageSquare, Bell, LogOut,
  ChevronRight, Settings, BarChart3, FileText, Handshake, Megaphone,
  X, Shield, GraduationCap,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { USER_ROLE_LABELS } from '@/types/user'
import logoWhite from '@/assets/logos/logo-white-full-horizontal.svg'

interface NavItem {
  to: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  badge?: number
}

interface NavSection {
  title?: string
  items: NavItem[]
}

interface SidebarProps {
  open: boolean
  onClose: () => void
  notifCount?: number
}

export default function Sidebar({ open, onClose, notifCount = 0 }: SidebarProps) {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const mainSections: NavSection[] = [
    {
      items: [{ to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' }],
    },
    {
      title: 'Research',
      items: [
        { to: '/research', icon: FolderOpen, label: 'Repository' },
        { to: '/research/submit', icon: Send, label: 'Submit Research' },
        { to: '/research/my', icon: BookOpen, label: 'My Submissions' },
      ],
    },
    {
      title: 'Events',
      items: [
        { to: '/events', icon: CalendarDays, label: 'Events' },
        { to: '/competitions', icon: Trophy, label: 'Competitions' },
        { to: '/certificates', icon: Award, label: 'My Certificates' },
      ],
    },
    {
      title: 'Mentorship',
      items: [
        { to: '/mentors', icon: Users2, label: 'Mentor Directory' },
        { to: '/research-assistants', icon: GraduationCap, label: 'Research Assistants' },
        { to: '/mentorship', icon: Heart, label: 'My Mentorship' },
      ],
    },
    {
      title: 'Resources',
      items: [{ to: '/resources', icon: Library, label: 'Learning Hub' }],
    },
    {
      title: 'Communication',
      items: [
        { to: '/messages', icon: MessageSquare, label: 'Messages' },
        {
          to: '/notifications',
          icon: Bell,
          label: 'Notifications',
          badge: notifCount > 0 ? notifCount : undefined,
        },
      ],
    },
  ]

  const adminSection: NavSection = {
    title: 'Administration',
    items: [
      { to: '/admin', icon: BarChart3, label: 'Admin Dashboard' },
      { to: '/admin/users', icon: Shield, label: 'User Management' },
      { to: '/admin/research', icon: BookOpen, label: 'Review Research' },
      { to: '/admin/events', icon: CalendarDays, label: 'Manage Events' },
      { to: '/admin/mentorship', icon: Handshake, label: 'Mentorship' },
      { to: '/admin/content', icon: Megaphone, label: 'Content & CMS' },
      { to: '/admin/reports', icon: FileText, label: 'Reports & Exports' },
    ],
  }

  const allSections = isAdmin ? [...mainSections, adminSection] : mainSections

  const initials = user
    ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() || user.email[0].toUpperCase()
    : '?'

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 z-40 flex flex-col
          bg-[#093344] text-white
          transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Logo area */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
          <img src={logoWhite} alt="YRIF" className="h-8 w-auto" />
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
          {allSections.map((section, si) => (
            <div key={si}>
              {section.title && (
                <p className="px-3 mb-1.5 text-[10px] font-semibold tracking-widest uppercase text-white/40">
                  {section.title}
                </p>
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === '/dashboard' || item.to === '/admin' || item.to === '/research'}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                          isActive
                            ? 'bg-[#0D9488] text-white shadow-sm'
                            : 'text-white/70 hover:text-white hover:bg-white/10'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon
                            className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-white/50 group-hover:text-white/80'}`}
                          />
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.badge !== undefined && (
                            <span className="ml-auto bg-[#df8d31] text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                              {item.badge > 99 ? '99+' : item.badge}
                            </span>
                          )}
                          {isActive && (
                            <ChevronRight className="w-3 h-3 text-white/60 flex-shrink-0" />
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* User profile footer */}
        <div className="flex-shrink-0 border-t border-white/10 p-3 space-y-1">
          <NavLink
            to="/profile"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-[#0D9488] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user ? `${user.first_name} ${user.last_name}`.trim() || user.email : '—'}
              </p>
              <p className="text-[11px] text-white/50 truncate">
                {user ? USER_ROLE_LABELS[user.role] : ''}
              </p>
            </div>
            <Settings className="w-4 h-4 text-white/30 group-hover:text-white/60 flex-shrink-0" />
          </NavLink>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}
