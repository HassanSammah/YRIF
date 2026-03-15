import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { GoogleLogin } from '@react-oauth/google'
import { Eye, EyeOff, Loader2, Mail, Lock, BookOpen, Users, Trophy } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import logoDark from '@/assets/logos/logo-dark.svg'
import logoWhite from '@/assets/logos/logo-white.svg'
import briqLogo from '@/assets/logos/briq-logo.png'

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

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    setServerError('')
    if (!credentialResponse.credential) return
    try {
      await googleLogin(credentialResponse.credential)
      navigate(from, { replace: true })
    } catch {
      setServerError('Google sign-in failed. Please try again.')
    }
  }

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
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setServerError('Google sign-in failed. Please try again.')}
              text="signin_with"
              shape="rectangular"
              width="320"
            />
          </div>

          {/* BRIQ phone auth */}
          <div className="mt-3 flex justify-center">
            <Link
              to="/auth/briq"
              className="w-[320px] h-10 flex items-center gap-3 rounded border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-150 shadow-sm"
            >
              <img src={briqLogo} alt="BRIQ" className="w-5 h-5 object-contain shrink-0" />
              <span className="flex-1 text-center">BRIQ Auth</span>
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
