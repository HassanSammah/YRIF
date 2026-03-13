import { Link } from 'react-router-dom'
import { Clock, Mail, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import logoDark from '@/assets/logos/logo-dark.svg'

export default function PendingApproval() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center px-4 py-16">
      {/* Logo */}
      <img src={logoDark} alt="YRIF" className="h-9 w-auto mb-10" />

      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Top stripe */}
        <div className="h-1.5 bg-gradient-to-r from-[#093344] via-[#0D9488] to-[#df8d31]" />

        <div className="px-8 py-8 text-center">
          {/* Icon */}
          <div className="inline-flex w-16 h-16 rounded-2xl bg-amber-50 items-center justify-center mb-5">
            <Clock className="w-8 h-8 text-amber-500" />
          </div>

          <h1 className="text-xl font-bold text-[#093344] font-display">Account Under Review</h1>

          {user && (
            <p className="mt-2 text-sm text-gray-600">
              Hi <span className="font-semibold">{user.first_name}</span>, your account is currently under review.
            </p>
          )}

          <p className="mt-3 text-sm text-gray-500 leading-relaxed">
            Our team will review your account and get back to you. If you have any questions, please reach out to us directly.
          </p>

          {/* Notification note */}
          <div className="mt-6 rounded-xl bg-[#093344]/5 border border-[#093344]/10 px-4 py-3.5 text-left flex items-start gap-3">
            <Mail className="w-4 h-4 text-[#093344] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-[#093344]">You'll be notified by email</p>
              <p className="text-xs text-gray-500 mt-0.5">
                We'll send updates to{' '}
                <span className="font-medium text-gray-700">{user?.email ?? 'your email'}</span>.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-col items-center gap-2">
            <a
              href="mailto:info@yriftz.org"
              className="text-sm text-[#0D9488] hover:text-[#093344] transition-colors font-medium"
            >
              Questions? Contact info@yriftz.org
            </a>
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mt-1 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      <p className="mt-6 text-xs text-gray-400">
        <Link to="/login" className="hover:text-gray-600 transition-colors">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
