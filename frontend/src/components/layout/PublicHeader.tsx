import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import logoDark from '@/assets/logos/logo-dark-full-horizontal.svg'

const NAV_LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Research', href: '#research' },
  { label: 'Events', href: '#events' },
  { label: 'Partners', href: '#partners' },
  { label: 'Vacancies', href: '/vacancies' },
  { label: 'Contact', href: '/contact' },
]

export default function PublicHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const isLanding = location.pathname === '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const headerClass = scrolled || !isLanding
    ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100'
    : 'bg-transparent'

  const handleNavClick = (href: string) => {
    setMobileOpen(false)
    if (href.startsWith('#') && isLanding) {
      const el = document.getElementById(href.slice(1))
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${headerClass}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <img src={logoDark} alt="YRIF" className="h-8 w-auto" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(({ label, href }) =>
              href.startsWith('#') ? (
                <button
                  key={label}
                  onClick={() => handleNavClick(href)}
                  className="text-sm font-medium text-content-secondary hover:text-brand-navy transition-colors"
                >
                  {label}
                </button>
              ) : (
                <Link
                  key={label}
                  to={href}
                  className="text-sm font-medium text-content-secondary hover:text-brand-navy transition-colors"
                >
                  {label}
                </Link>
              )
            )}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-brand-navy hover:text-brand-teal transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="text-sm font-semibold bg-brand-navy text-white px-4 py-2 rounded-lg hover:bg-brand-teal transition-colors"
            >
              Join YRIF
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-brand-navy"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 pb-4 pt-2 space-y-1">
          {NAV_LINKS.map(({ label, href }) =>
            href.startsWith('#') ? (
              <button
                key={label}
                onClick={() => handleNavClick(href)}
                className="block w-full text-left px-3 py-2 text-sm font-medium text-content-secondary hover:text-brand-navy hover:bg-gray-50 rounded-lg"
              >
                {label}
              </button>
            ) : (
              <Link
                key={label}
                to={href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 text-sm font-medium text-content-secondary hover:text-brand-navy hover:bg-gray-50 rounded-lg"
              >
                {label}
              </Link>
            )
          )}
          <div className="pt-2 flex flex-col gap-2">
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="block text-center px-4 py-2 text-sm font-medium border border-brand-navy text-brand-navy rounded-lg hover:bg-gray-50"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              onClick={() => setMobileOpen(false)}
              className="block text-center px-4 py-2 text-sm font-semibold bg-brand-navy text-white rounded-lg hover:bg-brand-teal transition-colors"
            >
              Join YRIF
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
