import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { UserCircle, Loader2, ChevronDown, Eye, EyeOff, BookOpen, Users, Trophy } from 'lucide-react'
import { authApi } from '@/api/accounts'
import { useAuthStore } from '@/store/auth'
import type { UserRole } from '@/types/user'
import logoWhite from '@/assets/logos/logo-white.svg'
import logoDark from '@/assets/logos/logo-dark.svg'
import { usePageTitle } from '@/hooks/usePageTitle'

interface LocationState {
  mode?: 'google' | 'briq'
  verify_token?: string
  phone_number?: string
  from?: string
}

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'youth', label: 'Youth / Student' },
  { value: 'researcher', label: 'Young Researcher' },
  { value: 'mentor', label: 'Mentor' },
  { value: 'research_assistant', label: 'Research Assistant' },
  { value: 'industry_partner', label: 'Industry / Community Partner' },
]

function inputCls(hasError?: boolean) {
  return [
    'w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-gray-900',
    'placeholder:text-gray-400 transition-all duration-150',
    'focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488]',
    hasError
      ? 'border-red-400 focus:ring-red-400/30 focus:border-red-400'
      : 'border-gray-200 hover:border-gray-300',
  ].join(' ')
}

export default function CompleteProfile() {
  usePageTitle('Complete Your Profile')
  const navigate = useNavigate()
  const location = useLocation()
  const { user, fetchMe, briqLogin } = useAuthStore()

  const state = location.state as LocationState | null
  const isBriq = state?.mode === 'briq'
  const redirectTo = state?.from ?? '/dashboard'

  // Form fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState<UserRole>('youth')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Pre-fill from auth store for Google users
  useEffect(() => {
    if (!isBriq && user) {
      setFirstName(user.first_name ?? '')
      setLastName(user.last_name ?? '')
    }
  }, [isBriq, user])

  // Guard: BRIQ mode needs verify_token + phone_number; Google mode needs authenticated user
  useEffect(() => {
    if (isBriq) {
      if (!state?.verify_token || !state?.phone_number) {
        navigate('/login', { replace: true })
      }
    } else {
      if (!user) {
        navigate('/login', { replace: true })
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async () => {
    setError('')

    if (isBriq) {
      if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
        setError('Please fill in all required fields.')
        return
      }
      setLoading(true)
      try {
        const { data } = await authApi.briqAuthComplete({
          phone_number: state!.phone_number!,
          verify_token: state!.verify_token!,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          password,
          role,
        })
        await briqLogin(data.access, data.refresh, data.user)
        navigate('/dashboard', { replace: true })
      } catch (err: unknown) {
        const errData = (err as { response?: { data?: Record<string, string | string[]> } })?.response?.data
        if (errData) {
          const msg = Object.values(errData).flat().join(' ')
          if (msg.toLowerCase().includes('token') && msg.toLowerCase().includes('expired')) {
            setError('Your phone verification has expired. Please start again.')
          } else {
            setError(msg || 'Registration failed.')
          }
        } else {
          setError('Registration failed. Please try again.')
        }
      } finally {
        setLoading(false)
      }
    } else {
      // Google mode — user already authenticated
      setLoading(true)
      try {
        await authApi.completeProfile({
          role,
          first_name: firstName.trim() || undefined,
          last_name: lastName.trim() || undefined,
        })
        await fetchMe()
        navigate(redirectTo, { replace: true })
      } catch (err: unknown) {
        const errData = (err as { response?: { data?: Record<string, string | string[]> } })?.response?.data
        if (errData) {
          setError(Object.values(errData).flat().join(' ') || 'Could not save profile.')
        } else {
          setError('Something went wrong. Please try again.')
        }
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[46%] xl:w-[52%] flex-col bg-[#093344] relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute bottom-0 -left-16 w-64 h-64 rounded-full bg-[#0D9488]/20" />
        <div className="absolute top-1/2 right-8 w-32 h-32 rounded-full bg-[#df8d31]/10" />

        <div className="relative z-10 px-10 pt-10">
          <img src={logoWhite} alt="YRIF" className="h-9 w-auto" />
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center px-10 pb-10">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-[#0D9488]/20 items-center justify-center mb-6">
            <UserCircle className="w-7 h-7 text-[#0D9488]" />
          </div>
          <h1 className="text-3xl xl:text-4xl font-bold text-white font-display leading-tight">
            Almost there!<br />Complete your<br />profile
          </h1>
          <p className="mt-4 text-white/70 text-base leading-relaxed max-w-xs">
            Tell us a bit about yourself so we can personalise your YRIF experience.
          </p>

          <div className="mt-10 space-y-4">
            {[
              { icon: BookOpen, label: 'Publish & showcase research' },
              { icon: Users, label: 'Connect with expert mentors' },
              { icon: Trophy, label: 'Compete in national events' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#0D9488]/30 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-[#0D9488]" />
                </div>
                <span className="text-white/80 text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 px-10 pb-8 text-white/30 text-xs">
          © {new Date().getFullYear()} Youth Research & Innovation Foundation · Tanzania
        </p>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 lg:px-14 xl:px-20 py-12 bg-white overflow-y-auto">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <img src={logoDark} alt="YRIF" className="h-10 w-auto" />
          </div>

          {/* Heading */}
          <div className="mb-8">
            <div className="inline-flex w-12 h-12 rounded-xl bg-[#0D9488]/10 items-center justify-center mb-4">
              <UserCircle className="w-6 h-6 text-[#0D9488]" />
            </div>
            <h2 className="text-2xl font-bold text-[#093344] font-display">Create your account</h2>
            <p className="text-gray-500 text-sm mt-1">
              {isBriq
                ? 'Your phone is verified. Fill in your details to finish signing up.'
                : 'Choose your role to personalise your YRIF experience.'}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
              {error.includes('expired') && (
                <span>
                  {' '}
                  <Link to="/auth/briq" className="font-semibold underline">
                    Try again
                  </Link>
                </span>
              )}
            </div>
          )}

          <div className="space-y-4">
            {/* Name fields — shown for BRIQ, shown (editable) for Google too */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                  First name{isBriq && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                <input
                  id="first_name"
                  type="text"
                  autoComplete="given-name"
                  placeholder="Hassan"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={inputCls(isBriq && !firstName.trim() && !!error)}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                  Last name{isBriq && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                <input
                  id="last_name"
                  type="text"
                  autoComplete="family-name"
                  placeholder="Samma"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={inputCls(isBriq && !lastName.trim() && !!error)}
                />
              </div>
            </div>

            {/* Email + Password — BRIQ only */}
            {isBriq && (
              <>
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputCls(!email.trim() && !!error)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${inputCls(!password.trim() && !!error)} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Email display — Google only (read-only) */}
            {!isBriq && user?.email && (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Email address</label>
                <div className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5 text-sm text-gray-500 select-none">
                  {user.email}
                </div>
              </div>
            )}

            {/* Role */}
            <div className="space-y-1.5">
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                I am a… <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className={`${inputCls()} appearance-none pr-9`}
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 rounded-xl bg-[#093344] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm mt-1"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Account
            </button>

            <p className="text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-[#0D9488] hover:text-[#093344] transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
