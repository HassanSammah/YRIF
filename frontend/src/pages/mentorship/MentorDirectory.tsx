import { useState } from 'react'
import { useQuery, useMutation } from 'react-query'
import { useForm } from 'react-hook-form'
import {
  Search, BadgeCheck, BookOpen, Clock, ChevronLeft, ChevronRight, Loader2, X,
} from 'lucide-react'
import { mentorshipApi } from '@/api/mentorship'
import { useAuth } from '@/hooks/useAuth'
import type { MentorListing } from '@/types/mentorship'

// ── Request Mentorship Modal ──────────────────────────────────────────────────

interface RequestForm {
  topic: string
  message: string
}

function RequestMentorshipModal({
  mentor,
  onClose,
}: {
  mentor: MentorListing
  onClose: () => void
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<RequestForm>()
  const [success, setSuccess] = useState(false)

  const mutation = useMutation(
    (data: RequestForm) =>
      mentorshipApi.createRequest({
        topic: data.topic,
        message: data.message,
        preferred_mentor: mentor.id,
      }),
    {
      onSuccess: () => setSuccess(true),
    },
  )

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
          <BadgeCheck className="mx-auto w-12 h-12 text-emerald-500 mb-4" />
          <h2 className="text-lg font-semibold text-[#093344] mb-2">Request Sent!</h2>
          <p className="text-sm text-gray-500 mb-6">
            Your mentorship request has been submitted. An admin will review and match you soon.
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
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-[#093344]">Request Mentorship</h2>
            <p className="text-xs text-gray-500 mt-0.5">with {mentor.full_name}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Topic / Area of interest <span className="text-red-500">*</span>
            </label>
            <input
              {...register('topic', { required: 'Topic is required' })}
              placeholder="e.g. Climate change research methods"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] hover:border-gray-300"
            />
            {errors.topic && (
              <p className="mt-1 text-xs text-red-600">{errors.topic.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Message to mentor
            </label>
            <textarea
              {...register('message')}
              rows={4}
              placeholder="Introduce yourself and explain what you're hoping to learn…"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] hover:border-gray-300 resize-none"
            />
          </div>

          {mutation.isError && (
            <p className="text-xs text-red-600">
              Something went wrong. Please try again.
            </p>
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

// ── Mentor Card ───────────────────────────────────────────────────────────────

function MentorCard({
  mentor,
  onRequest,
  canRequest,
}: {
  mentor: MentorListing
  onRequest: (m: MentorListing) => void
  canRequest: boolean
}) {
  const expertiseTags = mentor.expertise_areas
    ? mentor.expertise_areas.split(',').map((e) => e.trim()).filter(Boolean)
    : []

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-gray-900 text-sm">{mentor.full_name}</span>
            {mentor.is_verified && (
              <BadgeCheck className="w-4 h-4 text-[#0D9488] flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{mentor.email}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-[#0D9488] font-bold text-sm flex-shrink-0">
          {mentor.full_name.charAt(0)}
        </div>
      </div>

      {/* Bio */}
      {mentor.bio && (
        <p className="text-xs text-gray-600 line-clamp-2">{mentor.bio}</p>
      )}

      {/* Expertise tags */}
      {expertiseTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {expertiseTags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-xs text-[#0D9488]"
            >
              <BookOpen className="w-3 h-3" />
              {tag}
            </span>
          ))}
          {expertiseTags.length > 4 && (
            <span className="text-xs text-gray-400">+{expertiseTags.length - 4} more</span>
          )}
        </div>
      )}

      {/* Availability */}
      {mentor.availability && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          {mentor.availability}
        </div>
      )}

      {/* Action */}
      {canRequest && (
        <button
          onClick={() => onRequest(mentor)}
          className="mt-1 w-full rounded-xl bg-[#093344] hover:bg-[#0D9488] py-2.5 text-xs font-semibold text-white shadow-sm transition-all duration-200"
        >
          Request Mentorship
        </button>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function MentorDirectory() {
  const { isAuthenticated, isApproved, user } = useAuth()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedMentor, setSelectedMentor] = useState<MentorListing | null>(null)

  const { data, isLoading } = useQuery(
    ['mentors', search, page],
    () => mentorshipApi.listMentors({ search: search || undefined, page }).then((r) => r.data),
    { keepPreviousData: true },
  )

  // Only approved youth/researchers can request mentorship
  const canRequest =
    isAuthenticated &&
    isApproved &&
    !!user &&
    ['youth', 'researcher'].includes(user.role)

  const totalPages = data ? Math.ceil(data.count / 20) : 1

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mentor Directory</h1>
        <p className="text-sm text-gray-500 mt-1">
          Browse our network of expert mentors ready to guide your research journey.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search by name or expertise…"
          className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] hover:border-gray-300"
        />
      </div>

      {/* Count */}
      {data && (
        <p className="text-xs text-gray-400 mb-4">{data.count} mentor{data.count !== 1 ? 's' : ''} found</p>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
        </div>
      ) : !data?.results.length ? (
        <div className="py-20 text-center text-sm text-gray-400">
          No mentors found{search ? ' for your search' : ''}. Check back soon!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.results.map((mentor) => (
            <MentorCard
              key={mentor.id}
              mentor={mentor}
              onRequest={setSelectedMentor}
              canRequest={canRequest}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.count > 20 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg p-2 hover:bg-gray-100 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg p-2 hover:bg-gray-100 disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Auth prompt for non-logged-in users */}
      {!isAuthenticated && (
        <div className="mt-8 rounded-2xl bg-teal-50 border border-[#0D9488]/20 p-6 text-center">
          <p className="text-sm text-[#093344] font-medium">
            Want to request mentorship?{' '}
            <a href="/register" className="underline">Create an account</a> or{' '}
            <a href="/login" className="underline">sign in</a>.
          </p>
        </div>
      )}

      {/* Request modal */}
      {selectedMentor && (
        <RequestMentorshipModal
          mentor={selectedMentor}
          onClose={() => setSelectedMentor(null)}
        />
      )}
    </div>
  )
}
