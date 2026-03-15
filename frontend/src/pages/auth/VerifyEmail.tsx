import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Mail, ShieldCheck, Loader2, BookOpen, Users, Trophy, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { authApi } from '@/api/accounts'
import { useAuthStore } from '@/store/auth'
import logoWhite from '@/assets/logos/logo-white.svg'
import logoDark from '@/assets/logos/logo-dark.svg'
import { usePageTitle } from '@/hooks/usePageTitle'

type Step = 'email' | 'code'

export default function VerifyEmail() {
  usePageTitle('Verify Email')
  const navigate = useNavigate()
  const location = useLocation()
  const briqLogin = useAuthStore((s) => s.briqLogin)

  const stateEmail = (location.state as { email?: string } | null)?.email ?? ''

  const [step, setStep] = useState<Step>(stateEmail ? 'code' : 'email')
  const [email, setEmail] = useState(stateEmail)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [alreadyVerified, setAlreadyVerified] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)

  // Auto-send OTP when arriving with email pre-filled
  useEffect(() => {
    if (stateEmail) {
      handleSendCode(stateEmail)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (resendCountdown <= 0) return
    const t = setTimeout(() => setResendCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCountdown])

  const handleSendCode = async (emailToSend: string) => {
    if (!emailToSend) return
    setError('')
    setLoading(true)
    try {
      await authApi.sendEmailOTP(emailToSend)
      setStep('code')
      setResendCountdown(60)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Failed to send verification code. Please try again.'
      if (msg === 'This email has already been verified.') {
        setAlreadyVerified(true)
        setError('Your email is already verified. You can log in now.')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!code.trim()) return
    setError('')
    setLoading(true)
    try {
      const { data } = await authApi.verifyEmail(email, code.trim())
      await briqLogin(data.access, data.refresh, data.user)
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Invalid or expired code. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel (brand) ── */}
      <div className="hidden lg:flex lg:w-[46%] xl:w-[52%] flex-col bg-[#093344] relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute bottom-0 -left-16 w-64 h-64 rounded-full bg-[#0D9488]/20" />
        <div className="absolute top-1/2 right-8 w-32 h-32 rounded-full bg-[#df8d31]/10" />

        <div className="relative z-10 px-10 pt-10">
          <img src={logoWhite} alt="YRIF" className="h-9 w-auto" />
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center px-10 pb-10">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-[#0D9488]/20 items-center justify-center mb-6">
            <Mail className="w-7 h-7 text-[#0D9488]" />
          </div>
          <h1 className="text-3xl xl:text-4xl font-bold text-white font-display leading-tight">
            Check your<br />inbox
          </h1>
          <p className="mt-4 text-white/70 text-base leading-relaxed max-w-xs">
            We've sent a verification code to your email address. Enter it to activate your account.
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

      {/* ── Right panel (form) ── */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 lg:px-14 xl:px-20 py-12 bg-white">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <img src={logoDark} alt="YRIF" className="h-10 w-auto" />
          </div>

          <div className="mb-8">
            <div className="inline-flex w-12 h-12 rounded-xl bg-[#0D9488]/10 items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6 text-[#0D9488]" />
            </div>
            <h2 className="text-2xl font-bold text-[#093344] font-display">Verify your email</h2>
            <p className="text-gray-500 text-sm mt-1">
              {step === 'email'
                ? 'Enter your email address to receive a verification code.'
                : `We sent a 6-digit code to ${email}. Enter it below.`}
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
              {alreadyVerified && (
                <Link
                  to="/login"
                  className="mt-2 flex items-center gap-1 font-medium text-[#0D9488] hover:text-[#093344] transition-colors"
                >
                  Go to Login <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          )}

          {step === 'email' ? (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 pl-10 placeholder:text-gray-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] hover:border-gray-300"
                    onKeyDown={(e) => e.key === 'Enter' && handleSendCode(email)}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleSendCode(email)}
                disabled={loading || !email.trim()}
                className="w-full flex justify-center items-center gap-2 rounded-xl bg-[#093344] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Send Code
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                  Verification code
                </label>
                <input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 tracking-[0.25em] placeholder:text-gray-400 placeholder:tracking-normal transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] hover:border-gray-300"
                  onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                />
              </div>
              <button
                type="button"
                onClick={handleVerify}
                disabled={loading || code.length < 6}
                className="w-full flex justify-center items-center gap-2 rounded-xl bg-[#093344] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Verify
              </button>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="hover:text-[#093344] transition-colors"
                >
                  Change email
                </button>
                {resendCountdown > 0 ? (
                  <span className="text-gray-400">Resend in {resendCountdown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendCode(email)}
                    disabled={loading}
                    className="font-medium text-[#0D9488] hover:text-[#093344] transition-colors disabled:opacity-50"
                  >
                    Resend code
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
