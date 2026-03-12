import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import {
  Filter, Search, Loader2, CheckCircle, XCircle, Users, X, ChevronLeft, ChevronRight, ChevronDown,
} from 'lucide-react'
import { mentorshipApi } from '@/api/mentorship'
import type { MentorshipRequest, MentorshipMatch } from '@/types/mentorship'
import {
  MENTORSHIP_REQUEST_STATUS_LABELS,
  MENTORSHIP_MATCH_STATUS_LABELS,
} from '@/types/mentorship'

// ── Status badges ─────────────────────────────────────────────────────────────

const REQUEST_STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-teal-100 text-teal-800',
  matched: 'bg-green-100 text-green-800',
  declined: 'bg-red-100 text-red-700',
  closed: 'bg-gray-100 text-gray-600',
}

const MATCH_STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  completed: 'bg-teal-100 text-teal-700',
  cancelled: 'bg-red-100 text-red-700',
}

function StatusBadge({ label, style }: { label: string; style: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {label}
    </span>
  )
}

// ── Assign Mentor Modal ───────────────────────────────────────────────────────

function AssignMentorModal({
  request,
  onClose,
}: {
  request: MentorshipRequest
  onClose: () => void
}) {
  const qc = useQueryClient()
  const [success, setSuccess] = useState(false)
  const [selectedMentorId, setSelectedMentorId] = useState<string>(
    request.preferred_mentor ?? '',
  )
  const [search, setSearch] = useState('')

  const { data: mentorsData } = useQuery(
    ['mentors-picker', search],
    () => mentorshipApi.listMentors({ search: search || undefined }).then((r) => r.data),
  )

  const mutation = useMutation(
    (mentorId: string) => mentorshipApi.createMatch(request.id, mentorId),
    {
      onSuccess: () => {
        qc.invalidateQueries('admin-requests')
        qc.invalidateQueries('admin-matches')
        setSuccess(true)
      },
    },
  )

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
          <CheckCircle className="mx-auto w-12 h-12 text-emerald-500 mb-4" />
          <h2 className="text-lg font-semibold text-[#093344] mb-2">Match Created</h2>
          <p className="text-sm text-gray-500 mb-6">
            Both mentor and mentee have been notified by email.
          </p>
          <button
            onClick={onClose}
            className="rounded-xl bg-[#093344] hover:bg-[#0D9488] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200"
          >
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-[#093344]">Assign Mentor</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Mentee: {request.mentee_name} · Topic: {request.topic}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search mentors by name or expertise…"
              className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] hover:border-gray-300"
            />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {mentorsData?.results.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">No mentors found.</p>
            )}
            {mentorsData?.results.map((m) => (
              <label
                key={m.id}
                className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
                  selectedMentorId === m.id
                    ? 'border-[#0D9488] bg-teal-50'
                    : 'border-gray-100 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="mentor"
                  value={m.id}
                  checked={selectedMentorId === m.id}
                  onChange={() => setSelectedMentorId(m.id)}
                  className="mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">{m.full_name}</p>
                  <p className="text-xs text-gray-400">{m.expertise_areas || 'No expertise listed'}</p>
                  {m.is_verified && (
                    <span className="inline-block mt-1 text-xs text-[#0D9488]">✓ Verified</span>
                  )}
                </div>
              </label>
            ))}
          </div>

          {mutation.isError && (
            <p className="text-xs text-red-600">Something went wrong. Please try again.</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 bg-white text-gray-700 hover:border-[#0D9488] hover:text-[#0D9488] px-5 py-2.5 text-sm font-semibold shadow-sm transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={() => selectedMentorId && mutation.mutate(selectedMentorId)}
              disabled={!selectedMentorId || mutation.isLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-[#093344] hover:bg-[#0D9488] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 disabled:opacity-50"
            >
              {mutation.isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Match
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Request Row Actions ───────────────────────────────────────────────────────

function RequestActions({
  req,
  onAssign,
  onChanged,
}: {
  req: MentorshipRequest
  onAssign: (r: MentorshipRequest) => void
  onChanged: () => void
}) {
  const [loading, setLoading] = useState<string | null>(null)

  const doAction = async (action: 'approved' | 'declined') => {
    setLoading(action)
    try {
      await mentorshipApi.updateRequestStatus(req.id, action)
      onChanged()
    } finally {
      setLoading(null)
    }
  }

  if (req.status === 'pending' || req.status === 'approved') {
    return (
      <div className="flex flex-wrap gap-1.5 justify-end">
        {req.status === 'pending' && (
          <>
            <button
              onClick={() => doAction('approved')}
              disabled={!!loading}
              className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
            >
              {loading === 'approved' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
              Approve
            </button>
            <button
              onClick={() => doAction('declined')}
              disabled={!!loading}
              className="inline-flex items-center gap-1 rounded-xl bg-red-600 hover:bg-red-700 px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
            >
              {loading === 'declined' ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
              Decline
            </button>
          </>
        )}
        {(req.status === 'pending' || req.status === 'approved') && (
          <button
            onClick={() => onAssign(req)}
            className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-2 py-1 text-xs font-semibold text-white"
          >
            <Users className="w-3 h-3" /> Assign Mentor
          </button>
        )}
      </div>
    )
  }
  return null
}

// ── Match Actions ─────────────────────────────────────────────────────────────

function MatchActions({
  match,
  onChanged,
}: {
  match: MentorshipMatch
  onChanged: () => void
}) {
  const [loading, setLoading] = useState<string | null>(null)

  const doAction = async (s: 'completed' | 'cancelled') => {
    setLoading(s)
    try {
      await mentorshipApi.updateMatch(match.id, { status: s })
      onChanged()
    } finally {
      setLoading(null)
    }
  }

  if (match.status !== 'active') return null

  return (
    <div className="flex gap-1.5 justify-end">
      <button
        onClick={() => doAction('completed')}
        disabled={!!loading}
        className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
      >
        {loading === 'completed' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
        Complete
      </button>
      <button
        onClick={() => doAction('cancelled')}
        disabled={!!loading}
        className="inline-flex items-center gap-1 rounded-xl bg-red-600 hover:bg-red-700 px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
      >
        {loading === 'cancelled' ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
        Cancel
      </button>
    </div>
  )
}

// ── Main Admin Page ───────────────────────────────────────────────────────────

export default function MentorshipManagement() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'requests' | 'matches'>('requests')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [assignTarget, setAssignTarget] = useState<MentorshipRequest | null>(null)

  const { data: reqData, isLoading: loadingReqs, isFetching: fetchingReqs } = useQuery(
    ['admin-requests', statusFilter, search, page],
    () =>
      mentorshipApi.listRequests({ page }).then((r) => r.data),
    { keepPreviousData: true, enabled: tab === 'requests' },
  )

  const { data: matchData, isLoading: loadingMatches, isFetching: fetchingMatches } = useQuery(
    ['admin-matches', statusFilter, page],
    () =>
      mentorshipApi.listMatches({ status: (statusFilter as any) || undefined, page }).then((r) => r.data),
    { keepPreviousData: true, enabled: tab === 'matches' },
  )

  const invalidate = () => {
    qc.invalidateQueries('admin-requests')
    qc.invalidateQueries('admin-matches')
  }

  const totalPages = tab === 'requests'
    ? Math.ceil((reqData?.count ?? 0) / 20)
    : Math.ceil((matchData?.count ?? 0) / 20)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mentorship Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Review requests and manage mentor–mentee matches.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-5">
        {(['requests', 'matches'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setPage(1); setStatusFilter('') }}
            className={`rounded-lg px-5 py-1.5 text-sm font-medium transition-colors ${
              tab === t ? 'bg-white shadow-sm text-[#093344]' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'requests' ? 'Requests' : 'Matches'}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          {tab === 'requests' && (
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search topic or mentee…"
                className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] hover:border-gray-300"
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] hover:border-gray-300 appearance-none pr-10 cursor-pointer"
              >
                <option value="">All statuses</option>
                {tab === 'requests'
                  ? Object.entries(MENTORSHIP_REQUEST_STATUS_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))
                  : Object.entries(MENTORSHIP_MATCH_STATUS_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>
          {(fetchingReqs || fetchingMatches) && (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          )}
        </div>
      </div>

      {/* Requests table */}
      {tab === 'requests' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {loadingReqs ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
          ) : !reqData?.results.length ? (
            <div className="py-16 text-center text-sm text-gray-400">No requests found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                    <th className="text-left px-4 py-3 font-medium">Mentee</th>
                    <th className="text-left px-4 py-3 font-medium">Topic</th>
                    <th className="text-left px-4 py-3 font-medium">Preferred Mentor</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium">Date</th>
                    <th className="text-right px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {reqData.results.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{req.mentee_name}</div>
                        <div className="text-xs text-gray-400">{req.mentee_email}</div>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-gray-900 font-medium">{req.topic}</p>
                        {req.message && (
                          <p className="text-xs text-gray-400 line-clamp-1">{req.message}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {req.preferred_mentor_name ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          label={MENTORSHIP_REQUEST_STATUS_LABELS[req.status]}
                          style={REQUEST_STATUS_STYLES[req.status]}
                        />
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {new Date(req.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <RequestActions
                          req={req}
                          onAssign={setAssignTarget}
                          onChanged={invalidate}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {reqData && reqData.count > 20 && (
            <Pagination page={page} totalPages={totalPages} setPage={setPage} />
          )}
        </div>
      )}

      {/* Matches table */}
      {tab === 'matches' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {loadingMatches ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
          ) : !matchData?.results.length ? (
            <div className="py-16 text-center text-sm text-gray-400">No matches found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                    <th className="text-left px-4 py-3 font-medium">Mentor</th>
                    <th className="text-left px-4 py-3 font-medium">Mentee</th>
                    <th className="text-left px-4 py-3 font-medium">Topic</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium">Matched On</th>
                    <th className="text-right px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {matchData.results.map((match) => (
                    <tr key={match.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{match.mentor_name}</div>
                        <div className="text-xs text-gray-400">{match.mentor_email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{match.mentee_name}</div>
                        <div className="text-xs text-gray-400">{match.mentee_email}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {match.topic ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          label={MENTORSHIP_MATCH_STATUS_LABELS[match.status]}
                          style={MATCH_STATUS_STYLES[match.status]}
                        />
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {new Date(match.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <MatchActions match={match} onChanged={invalidate} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {matchData && matchData.count > 20 && (
            <Pagination page={page} totalPages={totalPages} setPage={setPage} />
          )}
        </div>
      )}

      {/* Assign mentor modal */}
      {assignTarget && (
        <AssignMentorModal
          request={assignTarget}
          onClose={() => setAssignTarget(null)}
        />
      )}
    </div>
  )
}

function Pagination({
  page,
  totalPages,
  setPage,
}: {
  page: number
  totalPages: number
  setPage: (p: (prev: number) => number) => void
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
      <span>Page {page} of {totalPages}</span>
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
  )
}
