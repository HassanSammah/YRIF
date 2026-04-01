import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import {
  Search, Filter, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, PauseCircle, ChevronDown,
  Loader2, Pencil, Trash2, X, Users, AlertTriangle,
} from 'lucide-react'
import { authApi } from '@/api/accounts'
import type { User, UserStatus, UserRole, DeletionRequest } from '@/types/user'
import { USER_STATUS_LABELS, USER_ROLE_LABELS, EDUCATION_LEVELS } from '@/types/user'
import { usePageTitle } from '@/hooks/usePageTitle'

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<UserStatus, string> = {
  active: 'bg-green-100 text-green-800',
  pending_approval: 'bg-amber-100 text-amber-800',
  pending_email: 'bg-blue-100 text-blue-800',
  suspended: 'bg-red-100 text-red-800',
  rejected: 'bg-gray-100 text-gray-600',
}

function StatusBadge({ status }: { status: UserStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {USER_STATUS_LABELS[status]}
    </span>
  )
}

// ── Role change dropdown ──────────────────────────────────────────────────────

const ASSIGNABLE_ROLES: UserRole[] = [
  'youth', 'researcher', 'mentor', 'research_assistant', 'industry_partner',
  'staff', 'program_manager', 'content_manager', 'judge',
]

function RoleDropdown({ user, onChanged }: { user: User; onChanged: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSelect = async (role: UserRole) => {
    if (role === user.role) { setOpen(false); return }
    setLoading(true)
    try {
      await authApi.updateUserRole(user.id, role)
      onChanged()
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:border-[#0D9488] hover:text-[#0D9488] transition-all duration-200"
      >
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : USER_ROLE_LABELS[user.role]}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-48 rounded-xl border border-gray-200 bg-white shadow-lg py-1">
          {ASSIGNABLE_ROLES.map((role) => (
            <button
              key={role}
              onClick={() => handleSelect(role)}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 ${role === user.role ? 'font-semibold text-[#0D9488]' : 'text-gray-700'}`}
            >
              {USER_ROLE_LABELS[role]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Action buttons ────────────────────────────────────────────────────────────

function ActionButtons({ user, onChanged }: { user: User; onChanged: () => void }) {
  const [loading, setLoading] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')

  const doAction = async (status: UserStatus, rej_reason = '') => {
    setLoading(status)
    try {
      await authApi.updateUserStatus(user.id, status, rej_reason || undefined)
      onChanged()
    } finally {
      setLoading(null)
      setRejecting(false)
      setReason('')
    }
  }

  const isLoading = (s: string) => loading === s

  return (
    <div className="flex flex-col gap-1.5 items-end">
      {user.status === 'pending_approval' && (
        <div className="flex gap-1.5">
          <button
            onClick={() => doAction('active')}
            disabled={!!loading}
            title="Approve"
            className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
          >
            {isLoading('active') ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
            Approve
          </button>
          <button
            onClick={() => setRejecting(true)}
            disabled={!!loading}
            title="Reject"
            className="inline-flex items-center gap-1 rounded-xl bg-red-600 hover:bg-red-700 px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
          >
            <XCircle className="w-3 h-3" /> Reject
          </button>
        </div>
      )}
      {user.status === 'active' && (
        <button
          onClick={() => doAction('suspended')}
          disabled={!!loading}
          title="Suspend"
          className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white text-gray-700 hover:border-[#0D9488] hover:text-[#0D9488] px-2 py-1 text-xs font-semibold shadow-sm transition-all duration-200 disabled:opacity-50"
        >
          {isLoading('suspended') ? <Loader2 className="w-3 h-3 animate-spin" /> : <PauseCircle className="w-3 h-3" />}
          Suspend
        </button>
      )}
      {(user.status === 'suspended' || user.status === 'rejected') && (
        <button
          onClick={() => doAction('active')}
          disabled={!!loading}
          className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
        >
          {isLoading('active') ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
          Reactivate
        </button>
      )}
      {rejecting && (
        <div className="flex gap-1.5 mt-1 items-center">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional)"
            className="w-full rounded-xl border border-gray-200 bg-white px-2 py-1 text-xs text-gray-900 placeholder:text-gray-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] hover:border-gray-300 w-40"
          />
          <button
            onClick={() => doAction('rejected', reason)}
            disabled={!!loading}
            className="rounded-xl bg-red-600 hover:bg-red-700 px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
          >
            {isLoading('rejected') ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirm'}
          </button>
          <button onClick={() => setRejecting(false)} className="text-xs text-gray-400 hover:underline">Cancel</button>
        </div>
      )}
    </div>
  )
}

// ── User Edit Modal ───────────────────────────────────────────────────────────

interface EditForm {
  first_name: string
  last_name: string
  email: string
  role: UserRole
  status: UserStatus
  profile: {
    institution: string
    bio: string
    region: string
    phone: string
    education_level: string
  }
}

function UserEditModal({ user, onClose, onSaved }: {
  user: User
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<EditForm>({
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    role: user.role,
    status: user.status,
    profile: {
      institution: user.profile?.institution ?? '',
      bio: user.profile?.bio ?? '',
      region: user.profile?.region ?? '',
      phone: user.profile?.phone ?? '',
      education_level: user.profile?.education_level ?? '',
    },
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setError('')
    setSaving(true)
    try {
      await authApi.updateUser(user.id, form)
      setSaved(true)
      setTimeout(() => { onSaved(); onClose() }, 800)
    } catch (e: unknown) {
      const data = (e as { response?: { data?: Record<string, string[]> & { detail?: string } } })?.response?.data
      if (data?.email) setError(`Email: ${data.email[0]}`)
      else setError(data?.detail ?? 'Failed to save changes.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Permanently delete ${user.first_name} ${user.last_name}? This cannot be undone.`)) return
    setDeleting(true)
    try {
      await authApi.deleteUser(user.id)
      onSaved()
      onClose()
    } catch {
      setError('Failed to delete user.')
      setDeleting(false)
    }
  }

  const set = (field: keyof EditForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const setProfile = (field: keyof EditForm['profile']) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, profile: { ...f.profile, [field]: e.target.value } }))

  const inputCls = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488]'

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative h-full w-full max-w-md bg-white shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Edit User</h2>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">First name</label>
              <input value={form.first_name} onChange={set('first_name')} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Last name</label>
              <input value={form.last_name} onChange={set('last_name')} className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={form.email} onChange={set('email')} className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
              <select value={form.role} onChange={set('role')} className={inputCls + ' appearance-none'}>
                {ASSIGNABLE_ROLES.map((r) => (
                  <option key={r} value={r}>{USER_ROLE_LABELS[r]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={set('status')} className={inputCls + ' appearance-none'}>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <hr className="border-gray-100" />
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Profile</p>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Institution</label>
            <input value={form.profile.institution} onChange={setProfile('institution')} placeholder="University or organisation" className={inputCls} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Region</label>
            <input value={form.profile.region} onChange={setProfile('region')} placeholder="e.g. Dar es Salaam" className={inputCls} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
            <input value={form.profile.phone} onChange={setProfile('phone')} placeholder="+255 7XX XXX XXX" className={inputCls} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Education Level</label>
            <select value={form.profile.education_level} onChange={setProfile('education_level')} className={inputCls + ' appearance-none'}>
              <option value="">— Select —</option>
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
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Bio</label>
            <textarea value={form.profile.bio} onChange={setProfile('bio')} rows={3} placeholder="Short bio…" className={inputCls + ' resize-none'} />
          </div>

          {error && (
            <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
          )}
          {saved && (
            <p className="text-emerald-700 text-xs bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Saved.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-5 py-4 flex items-center justify-between gap-3">
          <button
            onClick={handleDelete}
            disabled={deleting || saving}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Delete User
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || deleting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#093344] hover:bg-[#0D9488] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Deletion Requests Tab ─────────────────────────────────────────────────────

function DeletionRequestsTab() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery(
    'deletion-requests',
    () => authApi.listDeletionRequests().then((r) => r.data),
    { refetchOnWindowFocus: false },
  )

  const approveMutation = useMutation(
    (id: string) => authApi.approveDeletion(id),
    { onSuccess: () => qc.invalidateQueries('deletion-requests') },
  )
  const rejectMutation = useMutation(
    (id: string) => authApi.rejectDeletion(id),
    { onSuccess: () => qc.invalidateQueries('deletion-requests') },
  )

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  const requests: DeletionRequest[] = data?.results ?? []

  if (!requests.length) {
    return (
      <div className="py-16 text-center">
        <CheckCircle className="w-10 h-10 mx-auto mb-3 text-gray-200" />
        <p className="text-sm text-gray-400">No pending deletion requests.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => (
        <div key={req.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{req.user_name}</p>
              <p className="text-xs text-gray-500">{req.user_email}</p>
              {req.reason && (
                <p className="text-xs text-gray-600 mt-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5">
                  "{req.reason}"
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Requested {new Date(req.requested_at).toLocaleDateString()}
              </p>
              {req.status !== 'pending' && (
                <span className={`mt-1.5 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${req.status === 'approved' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                  {req.status === 'approved' ? 'Approved — user deleted' : 'Rejected'}
                </span>
              )}
            </div>
            {req.status === 'pending' && (
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={() => approveMutation.mutate(req.id)}
                  disabled={approveMutation.isLoading || rejectMutation.isLoading}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-50"
                >
                  {approveMutation.isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  Approve & Delete
                </button>
                <button
                  onClick={() => rejectMutation.mutate(req.id)}
                  disabled={approveMutation.isLoading || rejectMutation.isLoading}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {rejectMutation.isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

type Tab = 'users' | 'deletion_requests'

export default function UserManagement() {
  usePageTitle('User Management')
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('users')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [editUser, setEditUser] = useState<User | null>(null)

  const { data, isLoading, isFetching } = useQuery(
    ['users', search, roleFilter, statusFilter, page],
    () =>
      authApi.listUsers({
        search: search || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        page,
      }).then((r) => r.data),
    { keepPreviousData: true },
  )

  // Deletion requests count badge
  const { data: delData } = useQuery(
    'deletion-requests',
    () => authApi.listDeletionRequests().then((r) => r.data),
    { refetchOnWindowFocus: false },
  )
  const pendingDeletions = delData?.results?.filter((r: DeletionRequest) => r.status === 'pending').length ?? 0

  const invalidate = () => qc.invalidateQueries('users')

  const totalPages = data ? Math.ceil(data.count / 20) : 1

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {data?.count ?? '—'} total users
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${tab === 'users' ? 'bg-white shadow-sm text-[#093344]' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Users className="w-4 h-4" /> All Users
        </button>
        <button
          onClick={() => setTab('deletion_requests')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${tab === 'deletion_requests' ? 'bg-white shadow-sm text-[#093344]' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <AlertTriangle className="w-4 h-4" />
          Deletion Requests
          {pendingDeletions > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {pendingDeletions}
            </span>
          )}
        </button>
      </div>

      {tab === 'deletion_requests' ? (
        <DeletionRequestsTab />
      ) : (
        <>
          {/* Filters */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                  placeholder="Search name or email…"
                  className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] hover:border-gray-300"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] hover:border-gray-300 appearance-none pr-10 cursor-pointer"
                  >
                    <option value="">All statuses</option>
                    <option value="pending_approval">Pending Approval</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>

                <div className="relative">
                  <select
                    value={roleFilter}
                    onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] hover:border-gray-300 appearance-none pr-10 cursor-pointer"
                  >
                    <option value="">All roles</option>
                    {(Object.keys(USER_ROLE_LABELS) as UserRole[]).map((r) => (
                      <option key={r} value={r}>{USER_ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              {isFetching && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : !data?.results.length ? (
              <div className="py-16 text-center text-sm text-gray-400">No users found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                      <th className="text-left px-4 py-3 font-medium">User</th>
                      <th className="text-left px-4 py-3 font-medium">Role</th>
                      <th className="text-left px-4 py-3 font-medium">Status</th>
                      <th className="text-left px-4 py-3 font-medium">Joined</th>
                      <th className="text-right px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.results.map((user: User) => (
                      <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-content-primary">{user.first_name} {user.last_name}</div>
                          <div className="text-xs text-content-secondary">{user.email}</div>
                          {user.profile?.phone && (
                            <div className="text-xs text-content-secondary">{user.profile.phone}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <RoleDropdown user={user} onChanged={invalidate} />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={user.status} />
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1.5 items-end">
                            <button
                              onClick={() => setEditUser(user)}
                              className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-600 hover:border-[#0D9488] hover:text-[#0D9488] transition-colors"
                            >
                              <Pencil className="w-3 h-3" /> Edit
                            </button>
                            <ActionButtons user={user} onChanged={invalidate} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {data && data.count > 20 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
                <span>
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-lg p-1.5 hover:bg-gray-100 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="rounded-lg p-1.5 hover:bg-gray-100 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Edit slide-over */}
      {editUser && (
        <UserEditModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={() => { invalidate(); setEditUser(null) }}
        />
      )}
    </div>
  )
}
