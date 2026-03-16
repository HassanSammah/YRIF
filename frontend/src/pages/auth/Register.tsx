import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useGoogleLogin } from '@react-oauth/google'
import { Eye, EyeOff, Loader2, User, Mail, Lock, Phone as PhoneIcon, ChevronDown } from 'lucide-react'
import { authApi } from '@/api/accounts'
import { useAuthStore } from '@/store/auth'
import type { UserRole } from '@/types/user'
import logoDark from '@/assets/logos/logo-dark.svg'
import logoWhite from '@/assets/logos/logo-white.svg'
import briqLogo from '@/assets/logos/Briq-BlueTeal-Logo.svg'
import { usePageTitle } from '@/hooks/usePageTitle'

interface RegisterForm {
  first_name: string
  last_name: string
  email: string
  password: string
  confirm_password: string
  role: UserRole
  phone: string
}

const ROLE_OPTIONS: { value: UserRole; label: string; desc: string }[] = [
  { value: 'youth', label: 'Youth / Student', desc: 'University or secondary school student' },
  { value: 'researcher', label: 'Young Researcher', desc: 'Conducting independent research' },
  { value: 'mentor', label: 'Mentor', desc: 'Guide and support young researchers' },
  { value: 'research_assistant', label: 'Research Assistant', desc: 'Support ongoing research projects' },
  { value: 'industry_partner', label: 'Industry / Community Partner', desc: 'Organisation or industry collaborator' },
]

function Field({ id, label, hint, error, children }: {
  id: string; label: string; hint?: string; error?: string; children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

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

export default function Register() {
  usePageTitle('Sign Up')
  const navigate = useNavigate()
  const googleLogin = useAuthStore((s) => s.googleLogin)
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } =
    useForm<RegisterForm>({ defaultValues: { role: 'youth' } })

  const onSubmit = async (data: RegisterForm) => {
    setServerError('')
    try {
      await authApi.register({
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
        role: data.role,
        phone: data.phone || undefined,
      })
      navigate('/auth/verify-email', { state: { email: data.email }, replace: true })
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: Record<string, string | string[]> } })?.response?.data
      if (errData) {
        setServerError(Object.values(errData).flat().join(' ') || 'Registration failed.')
      } else {
        setServerError('Registration failed. Please try again.')
      }
    }
  }

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setServerError('')
      try {
        await googleLogin(tokenResponse.access_token)
        navigate('/dashboard', { replace: true })
      } catch {
        setServerError('Google sign-up failed. Please try again.')
      }
    },
    onError: () => setServerError('Google sign-up failed. Please try again.'),
  })

  return (
    <div className="min-h-screen flex">
      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex lg:w-[38%] xl:w-[42%] flex-col bg-[#093344] relative overflow-hidden flex-shrink-0">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute bottom-10 -left-12 w-56 h-56 rounded-full bg-[#0D9488]/20" />
        <div className="absolute top-1/3 right-4 w-24 h-24 rounded-full bg-[#df8d31]/10" />

        <div className="relative z-10 px-10 pt-10">
          <img src={logoWhite} alt="YRIF" className="h-9 w-auto" />
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center px-10 pb-10">
          <h1 className="text-3xl font-bold text-white font-display leading-snug">
            Join YRIF<br />and Shape<br />Tanzania's Future
          </h1>
          <p className="mt-4 text-white/65 text-sm leading-relaxed max-w-xs">
            Create your account and become part of a growing community of young researchers and innovators.
          </p>

          <div className="mt-8 p-5 rounded-2xl bg-white/8 border border-white/10">
            <p className="text-white/50 text-xs uppercase tracking-widest font-semibold mb-3">Who can join?</p>
            <ul className="space-y-2">
              {ROLE_OPTIONS.map((r) => (
                <li key={r.value} className="text-sm text-white/70 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488] mt-1.5 flex-shrink-0" />
                  <span>
                    <span className="text-white font-medium">{r.label}</span>
                    {' — '}
                    <span className="text-white/50 text-xs">{r.desc}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="relative z-10 px-10 pb-8 text-white/25 text-xs">
          © {new Date().getFullYear()} YRIF · Tanzania
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 lg:px-12 xl:px-16 py-10 bg-white overflow-y-auto">
        <div className="w-full max-w-lg mx-auto">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-6">
            <img src={logoDark} alt="YRIF" className="h-9 w-auto" />
          </div>

          <div className="mb-7">
            <h2 className="text-2xl font-bold text-[#093344] font-display">Create your account</h2>
            <p className="text-gray-500 text-sm mt-1">Fill in your details to get started</p>
          </div>

          {serverError && (
            <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <Field id="first_name" label="First name" error={errors.first_name?.message}>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  <input
                    id="first_name"
                    type="text"
                    autoComplete="given-name"
                    placeholder="Hassan"
                    className={`${inputCls(!!errors.first_name)} pl-9`}
                    {...register('first_name', { required: 'Required' })}
                  />
                </div>
              </Field>
              <Field id="last_name" label="Last name" error={errors.last_name?.message}>
                <input
                  id="last_name"
                  type="text"
                  autoComplete="family-name"
                  placeholder="Samma"
                  className={inputCls(!!errors.last_name)}
                  {...register('last_name', { required: 'Required' })}
                />
              </Field>
            </div>

            {/* Email */}
            <Field id="email" label="Email address" error={errors.email?.message}>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={`${inputCls(!!errors.email)} pl-9`}
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /\S+@\S+\.\S+/, message: 'Enter a valid email' },
                  })}
                />
              </div>
            </Field>

            {/* Role */}
            <Field id="role" label="I am a…" error={errors.role?.message}>
              <div className="relative">
                <select
                  id="role"
                  className={`${inputCls(!!errors.role)} appearance-none pr-9`}
                  {...register('role', { required: 'Please select a role' })}
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </Field>

            {/* Phone */}
            <Field
              id="phone"
              label="Phone number"
              hint="Used for SMS notifications and Briq OTP verification"
              error={errors.phone?.message}
            >
              <div className="relative">
                <PhoneIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+255 7XX XXX XXX (optional)"
                  className={`${inputCls()} pl-9`}
                  {...register('phone')}
                />
              </div>
            </Field>

            {/* Password */}
            <Field id="password" label="Password" error={errors.password?.message}>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  className={`${inputCls(!!errors.password)} pl-9 pr-10`}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'At least 8 characters' },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? 'Hide' : 'Show'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>

            {/* Confirm password */}
            <Field id="confirm_password" label="Confirm password" error={errors.confirm_password?.message}>
              <input
                id="confirm_password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Repeat password"
                className={inputCls(!!errors.confirm_password)}
                {...register('confirm_password', {
                  required: 'Please confirm your password',
                  validate: (val) => val === watch('password') || 'Passwords do not match',
                })}
              />
            </Field>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center gap-2 rounded-xl bg-[#093344] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm mt-1"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Create account
            </button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400 font-medium">or sign up with</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* BRIQ phone auth */}
          <div className="mb-3 flex justify-center">
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

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[#0D9488] hover:text-[#093344] transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
