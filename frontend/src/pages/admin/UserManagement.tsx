import { useState } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import {
  Search, Filter, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, PauseCircle, ChevronDown,
  Loader2,
} from 'lucide-react'
import { authApi } from '@/api/accounts'
import type { User, UserStatus, UserRole } from '@/types/user'
import { USER_STATUS_LABELS, USER_ROLE_LABELS } from '@/types/user'

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<UserStatus, string> = {
  active: 'bg-green-100 text-green-800',
  pending_approval: 'bg-amber-100 text-amber-800',
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
      {/* Reject with reason inline */}
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

// ── Main component ────────────────────────────────────────────────────────────

export default function UserManagement() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

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
                      <div className="font-medium text-gray-900">{user.first_name} {user.last_name}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
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
                      <ActionButtons user={user} onChanged={invalidate} />
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
    </div>
  )
}
