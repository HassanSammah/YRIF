import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import {
  User as UserIcon, Phone, Building, Award,
  Shield, CheckCircle, AlertCircle, Loader2, Save, ChevronDown,
  Mail, Trash2,
} from 'lucide-react'
import { authApi } from '@/api/accounts'
import { useAuth } from '@/hooks/useAuth'
import type { Profile, MentorProfile, PartnerProfile, ResearchAssistantProfile } from '@/types/user'
import { USER_STATUS_LABELS, USER_ROLE_LABELS, EDUCATION_LEVELS } from '@/types/user'

// ── Phone Verification ────────────────────────────────────────────────────────

function PhoneVerificationSection({ phone, verified, onVerified }: {
  phone: string
  verified: boolean
  onVerified: () => void
}) {
  const [step, setStep] = useState<'idle' | 'sent'>('idle')
  const [phoneInput, setPhoneInput] = useState(phone)
  const [otp, setOtp] = useState('')
  const [otpId, setOtpId] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const sendOTP = async () => {
    setError('')
    setSending(true)
    try {
      const res = await authApi.requestPhoneOTP(phoneInput)
      setOtpId(res.data.otp_id || '')
      setStep('sent')
    } catch {
      setError('Failed to send OTP. Check your phone number.')
    } finally {
      setSending(false)
    }
  }

  const verifyOTP = async () => {
    setError('')
    setSending(true)
    try {
      await authApi.verifyPhoneOTP(phoneInput, otpId, otp)
      onVerified()
      setStep('idle')
    } catch {
      setError('Invalid OTP. Please try again.')
    } finally {
      setSending(false)
    }
  }

  if (verified) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-700">
        <CheckCircle className="w-4 h-4" />
        <span>{phone}</span>
        <span className="text-green-600 font-medium">· Verified</span>
      </div>
    )
  }

  return (
    <div className="mt-3 space-y-2">
      {step === 'idle' ? (
        <div className="flex gap-2">
          <input
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            placeholder="+255 7XX XXX XXX"
            className="flex-1 rounded-xl border bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] border-gray-200 hover:border-gray-300"
          />
          <button
            onClick={sendOTP}
            disabled={sending || !phoneInput}
            className="inline-flex items-center gap-2 rounded-xl bg-[#093344] hover:bg-[#0D9488] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 disabled:opacity-50"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send OTP'}
          </button>
        </div>
      ) : (
        <div className="flex gap-2 flex-wrap">
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP code"
            maxLength={8}
            className="w-36 rounded-xl border bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] border-gray-200 hover:border-gray-300"
          />
          <button
            onClick={verifyOTP}
            disabled={sending || !otp}
            className="rounded-xl bg-[#0D9488] hover:bg-[#0D9488]/90 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 disabled:opacity-50"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
          </button>
          <button onClick={() => setStep('idle')} className="text-sm text-gray-500 hover:underline">
            Change number
          </button>
        </div>
      )}
      {error && (
        <p className="text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-sm flex items-center gap-1">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </p>
      )}
    </div>
  )
}

// ── Layout helpers ────────────────────────────────────────────────────────────

function Section({ icon: Icon, title, children }: {
  icon: React.ElementType; title: string; children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
        <Icon className="w-5 h-5 text-[#0D9488]" />
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] border-gray-200 hover:border-gray-300'

// ── Base profile form ─────────────────────────────────────────────────────────

function BaseProfileSection({ userId }: { userId: string }) {
  const qc = useQueryClient()
  const initialized = useRef(false)
  const { data: profile, isLoading } = useQuery(
    ['profile', userId],
    () => authApi.getProfile().then((r) => r.data),
    { staleTime: 30_000 },
  )
  const mutation = useMutation(
    (data: Partial<Profile>) => authApi.updateProfile(data).then((r) => r.data),
    { onSuccess: () => qc.invalidateQueries(['profile', userId]) },
  )
  const { register, handleSubmit, reset } = useForm<Profile>()

  useEffect(() => {
    if (profile && !initialized.current) {
      reset(profile)
      initialized.current = true
    }
  }, [profile, reset])

  if (isLoading) return <p className="text-sm text-gray-400">Loading…</p>

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Institution">
          <input {...register('institution')} placeholder="University or organisation" className={inputCls} />
        </Field>
        <Field label="Education Level">
          <div className="relative">
            <select
              {...register('education_level')}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 appearance-none pr-10 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] transition-all duration-150"
            >
              <option value="">Select education level</option>
              <optgroup label="Secondary School">
                {EDUCATION_LEVELS.filter((e) => e.group === 'Secondary').map((e) => (
                  <option key={e.value} value={e.value}>{e.label}</option>
                ))}
              </optgroup>
              <optgroup label="University">
                {EDUCATION_LEVELS.filter((e) => e.group === 'University').map((e) => (
                  <option key={e.value} value={e.value}>{e.label}</option>
                ))}
              </optgroup>
              <option value="other">Other</option>
            </select>
            <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </Field>
        <Field label="Region">
          <input {...register('region')} placeholder="e.g. Dar es Salaam" className={inputCls} />
        </Field>
      </div>
      <Field label="Bio">
        <textarea {...register('bio')} rows={3} placeholder="A short bio…" className={inputCls} />
      </Field>
      <Field label="Skills">
        <input {...register('skills')} placeholder="e.g. Python, Writing, Data Analysis (comma-separated)" className={inputCls} />
      </Field>
      <Field label="Research Interests">
        <textarea {...register('research_interests')} rows={2} placeholder="Topics you are passionate about…" className={inputCls} />
      </Field>
      <Field label="Achievements">
        <textarea {...register('achievements')} rows={2} placeholder="Awards, publications, recognition…" className={inputCls} />
      </Field>

      {mutation.isSuccess && (
        <p className="text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-sm flex items-center gap-1">
          <CheckCircle className="w-4 h-4 shrink-0" /> Saved.
        </p>
      )}
      {mutation.isError && (
        <p className="text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-sm flex items-center gap-1">
          <AlertCircle className="w-4 h-4 shrink-0" /> Save failed.
        </p>
      )}

      <button
        type="submit"
        disabled={mutation.isLoading}
        className="inline-flex items-center gap-2 rounded-xl bg-[#093344] hover:bg-[#0D9488] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 disabled:opacity-50"
      >
        {mutation.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save changes
      </button>
    </form>
  )
}

// ── Mentor profile form ───────────────────────────────────────────────────────

function MentorProfileSection({ userId }: { userId: string }) {
  const qc = useQueryClient()
  const initialized = useRef(false)
  const { data, isLoading } = useQuery(['mentor-profile', userId], () => authApi.getMentorProfile().then((r) => r.data))
  const mutation = useMutation(
    (d: Partial<MentorProfile>) => authApi.updateMentorProfile(d).then((r) => r.data),
    { onSuccess: () => qc.invalidateQueries(['mentor-profile', userId]) },
  )
  const { register, handleSubmit, reset } = useForm<MentorProfile>()

  useEffect(() => {
    if (data && !initialized.current) {
      reset(data)
      initialized.current = true
    }
  }, [data, reset])

  if (isLoading) return <p className="text-sm text-gray-400">Loading…</p>

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      {data?.is_verified && (
        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
          <CheckCircle className="w-4 h-4" /> Verified mentor
        </div>
      )}
      <Field label="Expertise Areas">
        <input {...register('expertise_areas')} placeholder="e.g. Climate Science, Machine Learning (comma-separated)" className={inputCls} />
      </Field>
      <Field label="Availability">
        <input {...register('availability')} placeholder="e.g. Weekends, 2 hours/week" className={inputCls} />
      </Field>
      <button type="submit" disabled={mutation.isLoading}
        className="inline-flex items-center gap-2 rounded-xl bg-[#093344] hover:bg-[#0D9488] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 disabled:opacity-50">
        {mutation.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
      </button>
    </form>
  )
}

// ── Partner profile form ──────────────────────────────────────────────────────

function PartnerProfileSection({ userId }: { userId: string }) {
  const qc = useQueryClient()
  const initialized = useRef(false)
  const { data, isLoading } = useQuery(['partner-profile', userId], () => authApi.getPartnerProfile().then((r) => r.data))
  const mutation = useMutation(
    (d: Partial<PartnerProfile>) => authApi.updatePartnerProfile(d).then((r) => r.data),
    { onSuccess: () => qc.invalidateQueries(['partner-profile', userId]) },
  )
  const { register, handleSubmit, reset } = useForm<PartnerProfile>()

  useEffect(() => {
    if (data && !initialized.current) {
      reset(data)
      initialized.current = true
    }
  }, [data, reset])

  if (isLoading) return <p className="text-sm text-gray-400">Loading…</p>

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      {data?.is_verified && (
        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
          <CheckCircle className="w-4 h-4" /> Verified partner
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Organisation Name">
          <input {...register('org_name')} placeholder="Company or organisation" className={inputCls} />
        </Field>
        <Field label="Partner Type">
          <div className="relative">
            <select {...register('partner_type')} className={inputCls + ' appearance-none'}>
              <option value="industry">Industry</option>
              <option value="community">Community</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </Field>
        <Field label="Sector">
          <input {...register('sector')} placeholder="e.g. Agriculture, Health" className={inputCls} />
        </Field>
        <Field label="Contact Person">
          <input {...register('contact_person')} placeholder="Primary contact name" className={inputCls} />
        </Field>
      </div>
      <button type="submit" disabled={mutation.isLoading}
        className="inline-flex items-center gap-2 rounded-xl bg-[#093344] hover:bg-[#0D9488] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 disabled:opacity-50">
        {mutation.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
      </button>
    </form>
  )
}

// ── Research Assistant profile form ───────────────────────────────────────────

function RAProfileSection({ userId }: { userId: string }) {
  const qc = useQueryClient()
  const initialized = useRef(false)
  const { data, isLoading } = useQuery(['ra-profile', userId], () => authApi.getAssistantProfile().then((r) => r.data))
  const mutation = useMutation(
    (d: Partial<ResearchAssistantProfile>) => authApi.updateAssistantProfile(d).then((r) => r.data),
    { onSuccess: () => qc.invalidateQueries(['ra-profile', userId]) },
  )
  const { register, handleSubmit, reset } = useForm<ResearchAssistantProfile>()

  useEffect(() => {
    if (data && !initialized.current) {
      reset(data)
      initialized.current = true
    }
  }, [data, reset])

  if (isLoading) return <p className="text-sm text-gray-400">Loading…</p>

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <Field label="Skills">
        <input {...register('skills')} placeholder="e.g. Lab work, Statistics, Python" className={inputCls} />
      </Field>
      <Field label="Availability">
        <input {...register('availability')} placeholder="e.g. Part-time, flexible hours" className={inputCls} />
      </Field>
      <Field label="Portfolio">
        <textarea {...register('portfolio')} rows={3} placeholder="Links to work, GitHub, publications…" className={inputCls} />
      </Field>
      <button type="submit" disabled={mutation.isLoading}
        className="inline-flex items-center gap-2 rounded-xl bg-[#093344] hover:bg-[#0D9488] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 disabled:opacity-50">
        {mutation.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
      </button>
    </form>
  )
}

// ── Email Change ──────────────────────────────────────────────────────────────

function ChangeEmailSection({ currentEmail, onChanged }: {
  currentEmail: string
  onChanged: () => void
}) {
  type EmailStep = 'idle' | 'entering' | 'otp' | 'done'
  const [step, setStep] = useState<EmailStep>('idle')
  const [newEmail, setNewEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const sendCode = async () => {
    setError('')
    setLoading(true)
    try {
      await authApi.changeEmail(newEmail)
      setStep('otp')
    } catch (e: any) {
      setError(e?.response?.data?.new_email?.[0] ?? e?.response?.data?.detail ?? 'Failed to send code.')
    } finally {
      setLoading(false)
    }
  }

  const verify = async () => {
    setError('')
    setLoading(true)
    try {
      await authApi.confirmEmailChange(newEmail, code)
      setStep('done')
      setTimeout(() => { setStep('idle'); setNewEmail(''); setCode(''); onChanged() }, 3000)
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Invalid or expired code.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'done') {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
        <CheckCircle className="w-4 h-4 shrink-0" /> Email updated successfully.
      </div>
    )
  }

  if (step === 'idle') {
    return (
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-700">{currentEmail}</span>
        <button
          onClick={() => setStep('entering')}
          className="text-xs font-medium text-[#0D9488] hover:underline"
        >
          Change
        </button>
      </div>
    )
  }

  if (step === 'entering') {
    return (
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="New email address"
            className="flex-1 rounded-xl border bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] border-gray-200"
          />
          <button
            onClick={sendCode}
            disabled={loading || !newEmail}
            className="inline-flex items-center gap-2 rounded-xl bg-[#093344] hover:bg-[#0D9488] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Code'}
          </button>
          <button onClick={() => { setStep('idle'); setNewEmail('') }} className="text-sm text-gray-500 hover:underline">
            Cancel
          </button>
        </div>
        {error && <p className="text-red-600 text-xs">{error}</p>}
      </div>
    )
  }

  // step === 'otp'
  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500">Enter the verification code sent to <strong>{newEmail}</strong></p>
      <div className="flex gap-2 flex-wrap">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="6-digit code"
          maxLength={8}
          className="w-36 rounded-xl border bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] border-gray-200"
        />
        <button
          onClick={verify}
          disabled={loading || !code}
          className="rounded-xl bg-[#0D9488] hover:bg-[#0D9488]/90 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
        </button>
        <button onClick={() => { setStep('idle'); setNewEmail(''); setCode('') }} className="text-sm text-gray-500 hover:underline">
          Cancel
        </button>
      </div>
      {error && <p className="text-red-600 text-xs">{error}</p>}
    </div>
  )
}

// ── Account Deletion ───────────────────────────────────────────────────────────

function AccountDeletionSection() {
  type DelStep = 'idle' | 'confirming' | 'submitted'
  const [step, setStep] = useState<DelStep>('idle')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    setError('')
    setLoading(true)
    try {
      await authApi.requestDeletion(reason)
      setStep('submitted')
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Failed to submit request. You may already have a pending request.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'submitted') {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-semibold text-gray-900">Request Submitted</h3>
        </div>
        <p className="text-sm text-gray-600">
          Your deletion request has been submitted. An admin will review it shortly. You will receive an email with the outcome.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-red-100 shadow-sm px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Delete Account</h3>
            <p className="text-xs text-gray-500">
              Request permanent deletion of your account and data. An admin must approve before anything is deleted.
            </p>
          </div>
          <button
            onClick={() => setStep('confirming')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors shrink-0"
          >
            <Trash2 className="w-4 h-4" /> Request Deletion
          </button>
        </div>
      </div>

      {/* Modal */}
      {step === 'confirming' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Request Account Deletion</h2>
                <p className="text-xs text-gray-500">Sorry to see you go.</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Your request will be reviewed by an admin before your account is permanently removed.
              You can continue using your account until the request is approved.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Let us know why you're leaving…"
                rows={3}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-300/40 focus:border-red-400 resize-none"
              />
            </div>
            {error && (
              <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                {error}
              </p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setStep('idle'); setReason(''); setError('') }}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Profile() {
  const { user, fetchMe } = useAuth()
  const qc = useQueryClient()

  if (!user) return null

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    pending_approval: 'bg-amber-100 text-amber-800',
    pending_email: 'bg-blue-100 text-blue-700',
    suspended: 'bg-red-100 text-red-800',
    rejected: 'bg-gray-100 text-gray-600',
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-[#093344]/10 flex items-center justify-center shrink-0">
            {user.profile?.avatar ? (
              <img src={user.profile.avatar} className="w-14 h-14 rounded-full object-cover" alt="Avatar" />
            ) : (
              <UserIcon className="w-7 h-7 text-[#093344]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900">{user.first_name} {user.last_name}</h1>
            <p className="text-sm text-gray-500 truncate">{user.email}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                {USER_ROLE_LABELS[user.role]}
              </span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[user.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {USER_STATUS_LABELS[user.status]}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <Mail className="w-4 h-4" /> Email address
            </div>
            <ChangeEmailSection currentEmail={user.email} onChanged={() => fetchMe()} />
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <Phone className="w-4 h-4" /> Phone verification
              <span className="text-xs text-gray-400 font-normal">· Changing your number will reset verification</span>
            </div>
            <PhoneVerificationSection
              phone={user.profile?.phone ?? ''}
              verified={user.profile?.phone_verified ?? false}
              onVerified={() => { qc.invalidateQueries(['profile', user.id]); fetchMe() }}
            />
          </div>
        </div>
      </div>

      {/* Base profile */}
      <Section icon={UserIcon} title="Profile Information">
        <BaseProfileSection userId={user.id} />
      </Section>

      {/* Role-specific extended profiles */}
      {user.role === 'mentor' && (
        <Section icon={Award} title="Mentor Profile">
          <MentorProfileSection userId={user.id} />
        </Section>
      )}
      {user.role === 'industry_partner' && (
        <Section icon={Building} title="Partner Profile">
          <PartnerProfileSection userId={user.id} />
        </Section>
      )}
      {user.role === 'research_assistant' && (
        <Section icon={Shield} title="Research Assistant Profile">
          <RAProfileSection userId={user.id} />
        </Section>
      )}

      {/* Account deletion */}
      <AccountDeletionSection />
    </div>
  )
}
