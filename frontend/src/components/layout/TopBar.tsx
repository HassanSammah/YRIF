import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, Bell, MessageSquare, Search, LogOut, User, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { USER_ROLE_LABELS } from '@/types/user'

interface TopBarProps {
  onMenuClick: () => void
  notifCount?: number
  msgCount?: number
  title?: string
}

export default function TopBar({ onMenuClick, notifCount = 0, msgCount = 0, title }: TopBarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    setDropdownOpen(false)
    await logout()
    navigate('/login')
  }

  const initials = user
    ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() || user.email[0].toUpperCase()
    : '?'

  return (
    <header className="h-14 bg-white/95 backdrop-blur-sm border-b border-gray-100/80 flex items-center px-4 gap-3 flex-shrink-0 z-20 relative shadow-[0_1px_3px_rgba(9,51,68,0.04)]">
      {/* Hamburger (mobile) */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-[#093344] hover:bg-gray-100 transition-colors"
        aria-label="Open navigation"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title */}
      {title && (
        <span className="hidden sm:block text-sm font-semibold text-[#093344] truncate">{title}</span>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      {searchOpen ? (
        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <input
            autoFocus
            type="text"
            placeholder="Search…"
            className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] transition-all"
          />
          <button
            onClick={() => setSearchOpen(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setSearchOpen(true)}
          className="p-2 rounded-lg text-gray-400 hover:text-[#093344] hover:bg-gray-100 transition-colors"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>
      )}

      {/* Messages */}
      <Link
        to="/messages"
        className="relative p-2 rounded-lg text-gray-400 hover:text-[#093344] hover:bg-gray-100 transition-colors"
        aria-label={`Messages${msgCount > 0 ? ` (${msgCount} unread)` : ''}`}
      >
        <MessageSquare className="w-4 h-4" />
        {msgCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white animate-pulse-dot" />
        )}
      </Link>

      {/* Notifications */}
      <Link
        to="/notifications"
        className="relative p-2 rounded-lg text-gray-400 hover:text-[#093344] hover:bg-gray-100 transition-colors"
        aria-label={`Notifications${notifCount > 0 ? ` (${notifCount} unread)` : ''}`}
      >
        <Bell className="w-4 h-4" />
        {notifCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#df8d31] ring-2 ring-white animate-pulse-dot" />
        )}
      </Link>

      {/* User dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((v) => !v)}
          className="flex items-center gap-2 p-1 rounded-xl hover:bg-gray-100 transition-colors"
          aria-label="Account menu"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#093344] to-[#0D9488] flex items-center justify-center text-[11px] font-bold text-white shadow-sm">
            {initials}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-[#093344] leading-none">
              {user ? `${user.first_name || user.email.split('@')[0]}` : '—'}
            </p>
            <p className="text-[10px] text-gray-400 leading-none mt-0.5">
              {user ? USER_ROLE_LABELS[user.role] : ''}
            </p>
          </div>
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-lg shadow-gray-200/60 border border-gray-100 py-1.5 z-50">
            <div className="px-4 py-2.5 border-b border-gray-100">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#093344] to-[#0D9488] flex items-center justify-center text-xs font-bold text-white shadow-sm flex-shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#093344] truncate">
                    {user ? `${user.first_name} ${user.last_name}`.trim() || user.email : '—'}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
                </div>
              </div>
            </div>
            <Link
              to="/profile"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-[#093344] hover:bg-gray-50 transition-colors"
            >
              <User className="w-3.5 h-3.5 text-gray-400" />
              View Profile
            </Link>
            <div className="border-t border-gray-100 mt-1 pt-1">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
