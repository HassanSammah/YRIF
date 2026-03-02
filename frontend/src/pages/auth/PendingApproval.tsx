import { Link } from 'react-router-dom'
import { Clock, Mail, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function PendingApproval() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
        </div>

        <div className="mt-6 bg-white py-8 px-6 shadow-sm rounded-xl border border-gray-100 text-center">
          <h1 className="text-xl font-bold text-gray-900">Account Pending Approval</h1>

          {user && (
            <p className="mt-2 text-sm text-gray-600">
              Hi <span className="font-medium">{user.first_name}</span>, your account is under review.
            </p>
          )}

          <p className="mt-4 text-sm text-gray-500 leading-relaxed">
            Your registration has been received. A YRIF administrator will review and approve
            your account shortly. This usually takes 1–2 business days.
          </p>

          <div className="mt-6 rounded-lg bg-blue-50 border border-blue-100 px-4 py-4 text-left">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800">You will be notified</p>
                <p className="text-xs text-blue-600 mt-0.5">
                  We will send a confirmation to{' '}
                  <span className="font-medium">{user?.email ?? 'your email'}</span> once approved.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <p className="text-xs text-gray-400">
              Questions? Contact us at{' '}
              <a href="mailto:info@yriftz.org" className="text-blue-600 hover:underline">
                info@yriftz.org
              </a>
            </p>
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 mt-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          <Link to="/login" className="hover:underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}
