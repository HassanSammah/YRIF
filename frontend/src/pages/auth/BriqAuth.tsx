import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Phone, Loader2, ChevronDown, ShieldCheck } from 'lucide-react'
import { authApi } from '@/api/accounts'
import { useAuthStore } from '@/store/auth'
import type { UserRole } from '@/types/user'
import { Eye, EyeOff, BookOpen, Users, Trophy } from 'lucide-react'
import logoWhite from '@/assets/logos/logo-white.svg'
import logoDark from '@/assets/logos/logo-dark.svg'
import { usePageTitle } from '@/hooks/usePageTitle'

type Step = 'phone' | 'otp' | 'register'

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

export default function BriqAuth() {
  usePageTitle('Authentication')
  const navigate = useNavigate()
  const briqLogin = useAuthStore((s) => s.briqLogin)

  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [otpId, setOtpId] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [verifyToken, setVerifyToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCountdown, setResendCountdown] = useState(0)

  // Registration form fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState<UserRole>('youth')

  useEffect(() => {
    if (resendCountdown <= 0) return
    const t = setTimeout(() => setResendCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCountdown])

  const handleRequestOTP = async () => {
    if (!phone.trim()) return
    setError('')
    setLoading(true)
    try {
      const { data } = await authApi.briqAuthRequest(phone.trim())
      setOtpId(data.otp_id)
      setStep('otp')
      setResendCountdown(60)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Failed to send OTP. Please check your phone number.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setError('')
    setLoading(true)
    try {
      const { data } = await authApi.briqAuthRequest(phone.trim())
      setOtpId(data.otp_id)
      setOtpCode('')
      setResendCountdown(60)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Failed to resend OTP.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (!otpCode.trim()) return
    setError('')
    setLoading(true)
    try {
      const { data } = await authApi.briqAuthVerify(phone.trim(), otpId, otpCode.trim())
      if (data.needs_registration) {
        setVerifyToken(data.verify_token)
        setStep('register')
      } else {
        // Existing user — data has access/refresh/user
        const authData = data as { access: string; refresh: string; user: import('@/types/user').User }
        await briqLogin(authData.access, authData.refresh, authData.user)
        navigate('/dashboard', { replace: true })
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Invalid or expired OTP. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteRegistration = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required fields.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const { data } = await authApi.briqAuthComplete({
        phone_number: phone.trim(),
        verify_token: verifyToken,
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
        setError(Object.values(errData).flat().join(' ') || 'Registration failed.')
      } else {
        setError('Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const leftTitle =
    step === 'register'
      ? 'Complete your registration'
      : 'Sign in with your phone number'

  const leftSubtitle =
    step === 'register'
      ? 'Fill in your details to create your account.'
      : "We'll send you a one-time code via SMS"

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
            <Phone className="w-7 h-7 text-[#0D9488]" />
          </div>
          <h1 className="text-3xl xl:text-4xl font-bold text-white font-display leading-tight">
            {leftTitle}
          </h1>
          <p className="mt-4 text-white/70 text-base leading-relaxed max-w-xs">
            {leftSubtitle}
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
              {step === 'register' ? (
                <ShieldCheck className="w-6 h-6 text-[#0D9488]" />
              ) : (
                <Phone className="w-6 h-6 text-[#0D9488]" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-[#093344] font-display">
              {step === 'phone' && 'Phone Sign In'}
              {step === 'otp' && 'Enter OTP'}
              {step === 'register' && 'Complete Sign Up'}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              {step === 'phone' && 'Enter your phone number to receive an OTP via SMS.'}
              {step === 'otp' && `OTP sent to ${phone}. Enter the code below.`}
              {step === 'register' && 'Your phone is verified. Complete your profile to finish signing up.'}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* ── Step: phone ── */}
          {step === 'phone' && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+255 7XX XXX XXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`${inputCls()} pl-10`}
                    onKeyDown={(e) => e.key === 'Enter' && handleRequestOTP()}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleRequestOTP}
                disabled={loading || !phone.trim()}
                className="w-full flex justify-center items-center gap-2 rounded-xl bg-[#093344] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Send OTP
              </button>
              <p className="text-center text-sm text-gray-500">
                Prefer email?{' '}
                <Link to="/login" className="font-semibold text-[#0D9488] hover:text-[#093344] transition-colors">
                  Sign in with email
                </Link>
              </p>
            </div>
          )}

          {/* ── Step: otp ── */}
          {step === 'otp' && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                  OTP code
                </label>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={8}
                  placeholder="Enter OTP"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  className={`${inputCls()} tracking-[0.2em] placeholder:tracking-normal`}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyOTP()}
                />
              </div>
              <button
                type="button"
                onClick={handleVerifyOTP}
                disabled={loading || !otpCode.trim()}
                className="w-full flex justify-center items-center gap-2 rounded-xl bg-[#093344] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Verify
              </button>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <button
                  type="button"
                  onClick={() => { setStep('phone'); setOtpCode(''); setError('') }}
                  className="hover:text-[#093344] transition-colors"
                >
                  Change number
                </button>
                {resendCountdown > 0 ? (
                  <span className="text-gray-400">Resend in {resendCountdown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={loading}
                    className="font-medium text-[#0D9488] hover:text-[#093344] transition-colors disabled:opacity-50"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Step: register ── */}
          {step === 'register' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                    First name
                  </label>
                  <input
                    id="first_name"
                    type="text"
                    autoComplete="given-name"
                    placeholder="Hassan"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={inputCls(!firstName.trim() && !!error)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                    Last name
                  </label>
                  <input
                    id="last_name"
                    type="text"
                    autoComplete="family-name"
                    placeholder="Samma"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={inputCls(!lastName.trim() && !!error)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
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
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  I am a…
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

              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
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

              <button
                type="button"
                onClick={handleCompleteRegistration}
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 rounded-xl bg-[#093344] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm mt-1"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Complete Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
