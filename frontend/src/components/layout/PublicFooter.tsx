import { Link } from 'react-router-dom'
import { Mail, Phone, MapPin, Twitter, Facebook, Linkedin, Youtube } from 'lucide-react'
import logoWhite from '@/assets/logos/logo-white-full-horizontal.svg'

const PLATFORM_LINKS = [
  { label: 'Research Repository', to: '/dashboard' },
  { label: 'Events & Competitions', to: '/events' },
  { label: 'Mentorship', to: '/mentors' },
  { label: 'Resources', to: '/resources' },
]

const ABOUT_LINKS = [
  { label: 'About YRIF', href: '/#about' },
  { label: 'Our Partners', href: '/#partners' },
  { label: 'News & Updates', href: '/#news' },
  { label: 'Contact Us', to: '/contact' },
]

const SOCIAL = [
  { Icon: Twitter, href: 'https://twitter.com/yriftz', label: 'Twitter' },
  { Icon: Facebook, href: 'https://facebook.com/yriftz', label: 'Facebook' },
  { Icon: Linkedin, href: 'https://linkedin.com/company/yriftz', label: 'LinkedIn' },
  { Icon: Youtube, href: 'https://youtube.com/@yriftz', label: 'YouTube' },
]

export default function PublicFooter() {
  return (
    <footer className="bg-brand-navy text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <img src={logoWhite} alt="YRIF" className="h-9 w-auto" />
            <p className="text-sm text-white/70 leading-relaxed">
              Tanzania's national digital platform empowering youth through research, innovation, and
              professional development.
            </p>
            <div className="flex gap-3">
              {SOCIAL.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="p-2 rounded-lg bg-white/10 hover:bg-brand-teal transition-colors"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-gold mb-4">
              Platform
            </h3>
            <ul className="space-y-2.5">
              {PLATFORM_LINKS.map(({ label, to }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-gold mb-4">
              Organization
            </h3>
            <ul className="space-y-2.5">
              {ABOUT_LINKS.map(({ label, href, to }) => (
                <li key={label}>
                  {to ? (
                    <Link to={to} className="text-sm text-white/70 hover:text-white transition-colors">
                      {label}
                    </Link>
                  ) : (
                    <a href={href} className="text-sm text-white/70 hover:text-white transition-colors">
                      {label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-gold mb-4">
              Contact
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-sm text-white/70">
                <Mail size={15} className="mt-0.5 flex-shrink-0 text-brand-teal" />
                <a href="mailto:info@yriftz.org" className="hover:text-white transition-colors">
                  info@yriftz.org
                </a>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-white/70">
                <Phone size={15} className="mt-0.5 flex-shrink-0 text-brand-teal" />
                <span>+255 XXX XXX XXX</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-white/70">
                <MapPin size={15} className="mt-0.5 flex-shrink-0 text-brand-teal" />
                <span>Dar es Salaam, Tanzania</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/50">
          <p>© {new Date().getFullYear()} Youth Research & Innovation Foundation. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/contact" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/contact" className="hover:text-white transition-colors">Terms of Use</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
