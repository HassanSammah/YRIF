import { useState } from 'react'
import { useQuery, useMutation } from 'react-query'
import { useForm } from 'react-hook-form'
import {
  Search, BadgeCheck, Briefcase, Clock, ChevronLeft, ChevronRight,
  Loader2, X, ExternalLink,
} from 'lucide-react'
import { mentorshipApi } from '@/api/mentorship'
import { useAuth } from '@/hooks/useAuth'
import type { RAListing } from '@/types/mentorship'
import { SkeletonCard } from '@/components/common/Skeleton'

// ── Request Collaboration Modal ───────────────────────────────────────────────

interface CollabForm {
  topic: string
  description: string
}

function RequestCollabModal({
  ra,
  onClose,
}: {
  ra: RAListing
  onClose: () => void
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<CollabForm>()
  const [success, setSuccess] = useState(false)

  const mutation = useMutation(
    (data: CollabForm) =>
      mentorshipApi.createCollabRequest({
        topic: data.topic,
        description: data.description,
        research_assistant: ra.id,
      }),
    { onSuccess: () => setSuccess(true) },
  )

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
          <BadgeCheck className="mx-auto w-12 h-12 text-emerald-500 mb-4" />
          <h2 className="text-lg font-semibold text-[#093344] mb-2">Request Sent!</h2>
          <p className="text-sm text-gray-500 mb-6">
            Your collaboration request has been sent to <strong>{ra.full_name}</strong>. They will review and respond shortly.
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
            <h2 className="text-lg font-semibold text-[#093344]">Request Collaboration</h2>
            <p className="text-xs text-gray-500 mt-0.5">with {ra.full_name}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Research topic <span className="text-red-500">*</span>
            </label>
            <input
              {...register('topic', { required: 'Topic is required' })}
              placeholder="e.g. Analysis of soil degradation data in Arusha"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] hover:border-gray-300"
            />
            {errors.topic && (
              <p className="mt-1 text-xs text-red-600">{errors.topic.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={4}
              placeholder="Describe your research project and what kind of assistance you're looking for…"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] hover:border-gray-300 resize-none"
            />
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
              type="submit"
              disabled={mutation.isLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-[#093344] hover:bg-[#0D9488] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 disabled:opacity-50"
            >
              {mutation.isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Send Request
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── RA Card ───────────────────────────────────────────────────────────────────

function RACard({
  ra,
  onRequest,
  canRequest,
}: {
  ra: RAListing
  onRequest: (r: RAListing) => void
  canRequest: boolean
}) {
  const skillTags = ra.skills
    ? ra.skills.split(',').map((s) => s.trim()).filter(Boolean)
    : []

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 card-lift">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="font-semibold text-gray-900 text-sm">{ra.full_name}</span>
          <p className="text-xs text-gray-400 mt-0.5">{ra.email}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#093344] to-[#0D9488] flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
          {ra.full_name.charAt(0)}
        </div>
      </div>

      {ra.bio && (
        <p className="text-xs text-gray-600 line-clamp-2">{ra.bio}</p>
      )}

      {skillTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {skillTags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-xs text-[#0D9488]"
            >
              <Briefcase className="w-3 h-3" />
              {tag}
            </span>
          ))}
          {skillTags.length > 4 && (
            <span className="text-xs text-gray-400">+{skillTags.length - 4} more</span>
          )}
        </div>
      )}

      {ra.availability && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          {ra.availability}
        </div>
      )}

      {ra.portfolio && (
        <a
          href={ra.portfolio.startsWith('http') ? ra.portfolio : `https://${ra.portfolio}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-[#0D9488] hover:underline"
        >
          <ExternalLink className="w-3 h-3" />
          View Portfolio
        </a>
      )}

      {canRequest && (
        <button
          onClick={() => onRequest(ra)}
          className="mt-1 w-full rounded-xl bg-[#093344] hover:bg-[#0D9488] py-2.5 text-xs font-semibold text-white shadow-sm transition-all duration-200"
        >
          Request Collaboration
        </button>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RADirectory() {
  const { isAuthenticated, isApproved, user } = useAuth()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedRA, setSelectedRA] = useState<RAListing | null>(null)

  const { data, isLoading } = useQuery(
    ['research-assistants', search, page],
    () => mentorshipApi.listRAs({ search: search || undefined, page }).then((r) => r.data),
    { keepPreviousData: true },
  )

  // Only approved youth/researchers can request collaboration
  const canRequest =
    isAuthenticated &&
    isApproved &&
    !!user &&
    ['youth', 'researcher'].includes(user.role)

  const totalPages = data ? Math.ceil(data.count / 20) : 1

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#093344]">Research Assistant Directory</h1>
        <p className="text-sm text-gray-500 mt-1">
          Partner with a research assistant to support your study or project.
        </p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search by name or skills…"
          className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] hover:border-gray-300"
        />
      </div>

      {data && (
        <p className="text-xs text-gray-400 mb-4">
          {data.count} research assistant{data.count !== 1 ? 's' : ''} found
        </p>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} rows={4} />)}
        </div>
      ) : !data?.results.length ? (
        <div className="py-20 text-center text-sm text-gray-400">
          No research assistants found{search ? ' for your search' : ''}. Check back soon!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.results.map((ra) => (
            <RACard
              key={ra.id}
              ra={ra}
              onRequest={setSelectedRA}
              canRequest={canRequest}
            />
          ))}
        </div>
      )}

      {data && data.count > 20 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg p-2 hover:bg-gray-100 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg p-2 hover:bg-gray-100 disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {!isAuthenticated && (
        <div className="mt-8 rounded-2xl bg-blue-50 border border-blue-200 p-6 text-center">
          <p className="text-sm text-[#093344] font-medium">
            Want to request collaboration?{' '}
            <a href="/register" className="underline">Create an account</a> or{' '}
            <a href="/login" className="underline">sign in</a>.
          </p>
        </div>
      )}

      {selectedRA && (
        <RequestCollabModal
          ra={selectedRA}
          onClose={() => setSelectedRA(null)}
        />
      )}
    </div>
  )
}
