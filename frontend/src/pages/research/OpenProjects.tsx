import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import {
  Search, GitBranch, Filter, ChevronLeft, ChevronRight,
  CheckCircle, Clock, Loader2, ChevronDown,
} from 'lucide-react'
import { researchApi } from '@/api/research'
import { useAuth } from '@/hooks/useAuth'
import { RESEARCH_CATEGORY_LABELS } from '@/types/research'
import type { Research, ResearchCategory, RAJoinRequestStatus } from '@/types/research'
import { usePageTitle } from '@/hooks/usePageTitle'

const CATEGORIES: { value: ResearchCategory | ''; label: string }[] = [
  { value: '', label: 'All Categories' },
  { value: 'natural_sciences', label: 'Natural Sciences' },
  { value: 'social_sciences', label: 'Social Sciences' },
  { value: 'arts', label: 'Arts & Humanities' },
  { value: 'technology', label: 'Technology & Engineering' },
]

const STATUS_BADGE: Record<string, { label: string; style: string }> = {
  submitted: { label: 'Submitted', style: 'bg-blue-100 text-blue-700' },
  under_review: { label: 'Under Review', style: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Approved', style: 'bg-green-100 text-green-700' },
  published: { label: 'Published', style: 'bg-emerald-100 text-emerald-700' },
}

function JoinRequestButton({ research, myRequests }: {
  research: Research
  myRequests: Record<string, RAJoinRequestStatus>
}) {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const existingStatus = myRequests[research.id]

  const joinMutation = useMutation(
    () => researchApi.submitJoinRequest(research.id, message),
    {
      onSuccess: () => {
        setSubmitted(true)
        setShowForm(false)
        qc.invalidateQueries('my-join-requests')
        qc.invalidateQueries('open-projects')
      },
    },
  )

  if (submitted || existingStatus === 'pending') {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
        <Clock className="w-3.5 h-3.5" />
        Request Pending
      </span>
    )
  }

  if (existingStatus === 'accepted') {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
        <CheckCircle className="w-3.5 h-3.5" />
        Collaborating
      </span>
    )
  }

  if (existingStatus === 'declined') {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
        Request Declined
      </span>
    )
  }

  if (showForm) {
    return (
      <div className="mt-3 space-y-2">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Briefly describe your relevant skills and how you can contribute (optional)"
          rows={3}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] resize-none"
        />
        <div className="flex gap-2">
          <button
            onClick={() => joinMutation.mutate()}
            disabled={joinMutation.isLoading}
            className="flex items-center gap-2 rounded-lg bg-[#0D9488] hover:bg-[#0c837a] px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-60"
          >
            {joinMutation.isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Submit Request
          </button>
          <button
            onClick={() => { setShowForm(false); setMessage('') }}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
        {joinMutation.isError && (
          <p className="text-xs text-red-600">
            {(joinMutation.error as any)?.response?.data?.detail ?? 'Failed to submit request.'}
          </p>
        )}
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowForm(true)}
      className="inline-flex items-center gap-1.5 rounded-lg bg-[#093344] hover:bg-[#0D9488] px-4 py-2 text-sm font-semibold text-white transition-all duration-200"
    >
      <GitBranch className="w-3.5 h-3.5" />
      Request to Join
    </button>
  )
}

export default function OpenProjects() {
  usePageTitle('Open Projects')
  const { user, isApproved } = useAuth()

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<ResearchCategory | ''>('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery(
    ['open-projects', search, category, page],
    () => researchApi.listOpenProjects({ search: search || undefined, category: category || undefined, page }).then(r => r.data),
    { keepPreviousData: true, enabled: isApproved },
  )

  // Load my join requests to show correct button states
  const { data: myRequestsData } = useQuery(
    'my-join-requests',
    () => researchApi.myJoinRequests().then(r => r.data),
    { enabled: isApproved },
  )

  // Only research assistants can access this page
  if (user && user.role !== 'research_assistant') {
    return <Navigate to="/research" replace />
  }

  // Map researchId → status for quick lookup
  const myRequests: Record<string, import('@/types/research').RAJoinRequestStatus> = {}
  myRequestsData?.results?.forEach(req => {
    myRequests[req.research] = req.status
  })

  const totalPages = data ? Math.ceil(data.count / 20) : 1

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-[#093344] flex items-center justify-center">
            <GitBranch className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#093344]">Open Research Projects</h1>
        </div>
        <p className="text-sm text-gray-500 ml-12">
          Browse research projects open for RA collaboration and request to join
        </p>
      </div>

      {/* Search + Filter */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <form onSubmit={handleSearch} className="flex-1 min-w-60 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search title, abstract, keywords…"
                className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488]"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-[#093344] hover:bg-[#0D9488] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200"
            >
              Search
            </button>
          </form>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <div className="relative">
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value as ResearchCategory | ''); setPage(1) }}
                className="appearance-none rounded-xl border border-gray-200 bg-white pl-3 pr-8 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488]"
              >
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : !data?.results?.length ? (
        <div className="text-center py-20 text-gray-400">
          <GitBranch className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No open projects found</p>
          <p className="text-sm mt-1">Check back later — researchers will mark projects as open when they need RA support</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.results.map((research) => {
            const statusCfg = STATUS_BADGE[research.status] ?? { label: research.status, style: 'bg-gray-100 text-gray-600' }
            return (
              <div
                key={research.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusCfg.style}`}>
                        {statusCfg.label}
                      </span>
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#093344]/10 text-[#093344]">
                        {RESEARCH_CATEGORY_LABELS[research.category]}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-[#093344] mb-1 truncate">{research.title}</h3>
                    <p className="text-xs text-gray-500 mb-2">
                      by {research.author_name}
                      {research.author_institution && ` · ${research.author_institution}`}
                    </p>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{research.abstract}</p>
                    {research.collaboration_description && (
                      <div className="bg-[#f0fdfa] border border-[#0D9488]/20 rounded-lg p-3 mb-3">
                        <p className="text-xs font-semibold text-[#0D9488] mb-1">Looking for:</p>
                        <p className="text-sm text-[#093344]">{research.collaboration_description}</p>
                      </div>
                    )}
                    {research.keywords && (
                      <p className="text-xs text-gray-400">Keywords: {research.keywords}</p>
                    )}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <JoinRequestButton research={research} myRequests={myRequests} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
