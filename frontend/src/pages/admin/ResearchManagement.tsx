import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Link } from 'react-router-dom'
import {
  Search, Filter, Loader2, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, Globe, UserPlus, Eye,
} from 'lucide-react'
import { researchApi } from '@/api/research'
import { authApi } from '@/api/accounts'
import { RESEARCH_CATEGORY_LABELS, RESEARCH_STATUS_LABELS } from '@/types/research'
import type { Research, ResearchStatus, ResearchCategory } from '@/types/research'

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<ResearchStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  submitted: 'bg-blue-100 text-blue-700',
  under_review: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  published: 'bg-emerald-100 text-emerald-700',
}

// ── Assign reviewer modal ─────────────────────────────────────────────────────

function AssignReviewerModal({
  research,
  onClose,
  onAssigned,
}: {
  research: Research
  onClose: () => void
  onAssigned: () => void
}) {
  const [reviewerId, setReviewerId] = useState('')
  const [error, setError] = useState('')

  const { data: users, isLoading: usersLoading } = useQuery(
    'users-mentor-active',
    () =>
      authApi
        .listUsers({ role: 'mentor', status: 'active', page: 1 })
        .then((r) => r.data),
  )

  const assignMutation = useMutation(
    () => researchApi.assignReviewer(research.id, reviewerId),
    {
      onSuccess: () => { onAssigned(); onClose() },
      onError: () => setError('Failed to assign reviewer. Please try again.'),
    },
  )

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Assign Reviewer</h2>
        <p className="text-sm text-gray-500 mb-4 line-clamp-1 italic">{research.title}</p>

        <label htmlFor="reviewer-select" className="block text-sm font-medium text-gray-700 mb-1">
          Reviewer (Mentor)
        </label>
        <select
          id="reviewer-select"
          value={reviewerId}
          onChange={(e) => setReviewerId(e.target.value)}
          disabled={usersLoading}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3 disabled:opacity-60"
        >
          <option value="">
            {usersLoading ? 'Loading mentors…' : 'Select a reviewer…'}
          </option>
          {users?.results.map((u) => (
            <option key={u.id} value={u.id}>
              {u.first_name} {u.last_name} — {u.email}
            </option>
          ))}
        </select>

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              if (!reviewerId) { setError('Please select a reviewer.'); return }
              assignMutation.mutate()
            }}
            disabled={assignMutation.isLoading}
            className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {assignMutation.isLoading
              ? <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              : 'Assign'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Table row ─────────────────────────────────────────────────────────────────

function ResearchRow({ research, onRefresh }: { research: Research; onRefresh: () => void }) {
  const [assigning, setAssigning] = useState(false)

  const decideMutation = useMutation(
    (data: { decision: 'approve' | 'reject'; reason?: string }) =>
      researchApi.decide(research.id, data),
    { onSuccess: onRefresh },
  )

  const publishMutation = useMutation(
    () => researchApi.publish(research.id),
    { onSuccess: onRefresh },
  )

  const canDecide = research.status === 'submitted' || research.status === 'under_review'

  return (
    <>
      {assigning && (
        <AssignReviewerModal
          research={research}
          onClose={() => setAssigning(false)}
          onAssigned={onRefresh}
        />
      )}
      <tr className="hover:bg-gray-50/50 transition-colors">
        <td className="px-4 py-3">
          <Link
            to={`/research/${research.id}`}
            className="font-medium text-gray-900 hover:text-blue-700 line-clamp-1 text-sm block"
          >
            {research.title}
          </Link>
          <div className="text-xs text-gray-400 mt-0.5">{research.author_name}</div>
        </td>
        <td className="px-4 py-3 text-xs text-gray-600">
          {RESEARCH_CATEGORY_LABELS[research.category]}
        </td>
        <td className="px-4 py-3">
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[research.status]}`}>
            {RESEARCH_STATUS_LABELS[research.status]}
          </span>
        </td>
        <td className="px-4 py-3 text-xs text-gray-400">
          {new Date(research.created_at).toLocaleDateString()}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5 justify-end flex-wrap">
            <Link
              to={`/research/${research.id}`}
              className="inline-flex items-center gap-1 rounded-md bg-gray-50 border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
            >
              <Eye className="w-3 h-3" /> View
            </Link>

            {canDecide && (
              <button
                type="button"
                onClick={() => setAssigning(true)}
                className="inline-flex items-center gap-1 rounded-md bg-gray-50 border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
              >
                <UserPlus className="w-3 h-3" /> Assign
              </button>
            )}

            {canDecide && (
              <>
                <button
                  type="button"
                  onClick={() => decideMutation.mutate({ decision: 'approve' })}
                  disabled={decideMutation.isLoading}
                  className="inline-flex items-center gap-1 rounded-md bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {decideMutation.isLoading
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <CheckCircle className="w-3 h-3" />}
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const reason = window.prompt('Rejection reason (optional):') ?? ''
                    decideMutation.mutate({ decision: 'reject', reason })
                  }}
                  disabled={decideMutation.isLoading}
                  className="inline-flex items-center gap-1 rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200 disabled:opacity-50"
                >
                  <XCircle className="w-3 h-3" /> Reject
                </button>
              </>
            )}

            {research.status === 'approved' && (
              <button
                type="button"
                onClick={() => publishMutation.mutate()}
                disabled={publishMutation.isLoading}
                className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {publishMutation.isLoading
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : <Globe className="w-3 h-3" />}
                Publish
              </button>
            )}
          </div>
        </td>
      </tr>
    </>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ResearchManagement() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, isFetching } = useQuery(
    ['admin-research', search, statusFilter, categoryFilter, page],
    () =>
      researchApi
        .adminList({
          search: search || undefined,
          status: statusFilter || undefined,
          category: categoryFilter || undefined,
          page,
        })
        .then((r) => r.data),
    { keepPreviousData: true },
  )

  const refresh = () => qc.invalidateQueries('admin-research')
  const totalPages = data ? Math.ceil(data.count / 20) : 1

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Research Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {data?.count ?? '—'} total submissions
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
              placeholder="Search title or author…"
              className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
              aria-label="Filter by status"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All statuses</option>
              {(Object.entries(RESEARCH_STATUS_LABELS) as [ResearchStatus, string][]).map(
                ([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ),
              )}
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }}
              aria-label="Filter by category"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All categories</option>
              {(Object.entries(RESEARCH_CATEGORY_LABELS) as [ResearchCategory, string][]).map(
                ([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ),
              )}
            </select>
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
          <div className="py-16 text-center text-sm text-gray-400">
            No research submissions found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="text-left px-4 py-3 font-medium">Title / Author</th>
                  <th className="text-left px-4 py-3 font-medium">Category</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Submitted</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.results.map((r) => (
                  <ResearchRow key={r.id} research={r} onRefresh={refresh} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.count > 20 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                aria-label="Previous page"
                className="rounded-lg p-1.5 hover:bg-gray-100 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                aria-label="Next page"
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
