import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useGoogleLogin } from '@react-oauth/google'
import { Eye, EyeOff, Loader2, Mail, Lock, BookOpen, Users, Trophy } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import logoDark from '@/assets/logos/logo-dark.svg'
import logoWhite from '@/assets/logos/logo-white.svg'
import briqLogo from '@/assets/logos/Briq-BlueTeal-Logo.svg'
import { usePageTitle } from '@/hooks/usePageTitle'

interface LoginForm {
  email: string
  password: string
}

// Reusable styled field
function Field({
  id, label, error, children,
}: {
  id: string; label: string; error?: string; children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-600 flex items-center gap-1">{error}</p>}
    </div>
  )
}

// Reusable input class helper
function inputCls(hasError?: boolean) {
  return [
    'w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-gray-900',
    'placeholder:text-gray-400',
    'transition-all duration-150',
    'focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488]',
    hasError ? 'border-red-400 focus:ring-red-400/30 focus:border-red-400' : 'border-gray-200 hover:border-gray-300',
  ].join(' ')
}

export default function Login() {
  usePageTitle('Login')
  const navigate = useNavigate()
  const location = useLocation()
  const { login, googleLogin } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')

  const from = (location.state as { from?: string })?.from ?? '/dashboard'

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>()

  const onSubmit = async (data: LoginForm) => {
    setServerError('')
    try {
      await login(data.email, data.password)
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string; non_field_errors?: string[] } } })
          ?.response?.data?.detail ??
        (err as { response?: { data?: { non_field_errors?: string[] } } })
          ?.response?.data?.non_field_errors?.[0] ??
        'Sign in failed. Please check your credentials.'
      setServerError(msg)
    }
  }

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setServerError('')
      try {
        const { is_new } = await googleLogin(tokenResponse.access_token)
        if (is_new) {
          navigate('/auth/complete-profile', { replace: true, state: { mode: 'google', from } })
        } else {
          navigate(from, { replace: true })
        }
      } catch {
        setServerError('Google sign-in failed. Please try again.')
      }
    },
    onError: () => setServerError('Google sign-in failed. Please try again.'),
  })

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel (brand) ── */}
      <div className="hidden lg:flex lg:w-[46%] xl:w-[52%] flex-col bg-[#093344] relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute bottom-0 -left-16 w-64 h-64 rounded-full bg-[#0D9488]/20" />
        <div className="absolute top-1/2 right-8 w-32 h-32 rounded-full bg-[#df8d31]/10" />

        {/* Logo */}
        <div className="relative z-10 px-10 pt-10">
          <img src={logoWhite} alt="YRIF" className="h-9 w-auto" />
        </div>

        {/* Center content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-10 pb-10">
          <h1 className="text-3xl xl:text-4xl font-bold text-white font-display leading-tight">
            Empowering<br />Tanzania's Youth<br />Through Research
          </h1>
          <p className="mt-4 text-white/70 text-base leading-relaxed max-w-xs">
            Join thousands of young researchers, mentors, and innovators on the YRIF national platform.
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

        {/* Footer tagline */}
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

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#093344] font-display">Welcome back</h2>
            <p className="text-gray-500 text-sm mt-1">Sign in to your YRIF account</p>
          </div>

          {/* Error */}
          {serverError && (
            <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {serverError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <Field id="email" label="Email address" error={errors.email?.message}>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={`${inputCls(!!errors.email)} pl-10`}
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /\S+@\S+\.\S+/, message: 'Enter a valid email' },
                  })}
                />
              </div>
            </Field>

            <Field id="password" label="Password" error={errors.password?.message}>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`${inputCls(!!errors.password)} pl-10 pr-10`}
                  {...register('password', { required: 'Password is required' })}
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
            </Field>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center gap-2 rounded-xl bg-[#093344] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Sign in
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400 font-medium">or continue with</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Google */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => handleGoogleLogin()}
              className="w-[320px] h-10 flex items-center gap-3 rounded border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-150 shadow-sm"
            >
              <span className="w-7 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </span>
              <span className="flex-1 text-center">Your Google Account</span>
            </button>
          </div>

          {/* BRIQ phone auth */}
          <div className="mt-3 flex justify-center">
            <Link
              to="/auth/briq"
              className="w-[320px] h-10 flex items-center gap-3 rounded border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-150 shadow-sm"
            >
              <span className="w-7 flex items-center justify-center shrink-0">
                <img src={briqLogo} alt="BRIQ" className="w-7 h-7 object-contain" />
              </span>
              <span className="flex-1 text-center">Your Phone Number</span>
            </Link>
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-[#0D9488] hover:text-[#093344] transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
