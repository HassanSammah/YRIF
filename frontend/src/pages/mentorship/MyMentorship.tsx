import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import {
  Users, Star, CheckCircle, Clock, MessageSquare,
  Loader2, X,
} from 'lucide-react'
import { mentorshipApi } from '@/api/mentorship'
import { authApi } from '@/api/accounts'
import { useAuth } from '@/hooks/useAuth'
import type { MentorshipMatch, MentorshipMatchStatus } from '@/types/mentorship'
import {
  MENTORSHIP_REQUEST_STATUS_LABELS,
  MENTORSHIP_MATCH_STATUS_LABELS,
} from '@/types/mentorship'

// ── Status badge helpers ──────────────────────────────────────────────────────

const REQUEST_STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-blue-100 text-blue-800',
  matched: 'bg-green-100 text-green-800',
  declined: 'bg-red-100 text-red-700',
  closed: 'bg-gray-100 text-gray-600',
}

const MATCH_STATUS_STYLES: Record<MentorshipMatchStatus, string> = {
  active: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
}

function StatusBadge({ label, style }: { label: string; style: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {label}
    </span>
  )
}

// ── Feedback Modal ────────────────────────────────────────────────────────────

interface FeedbackForm {
  feedback_text: string
  rating: number
}

function FeedbackModal({ match, onClose }: { match: MentorshipMatch; onClose: () => void }) {
  const qc = useQueryClient()
  const [success, setSuccess] = useState(false)
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FeedbackForm>()
  const rating = watch('rating')

  const mutation = useMutation(
    (data: FeedbackForm) =>
      mentorshipApi.submitFeedback(match.id, {
        feedback_text: data.feedback_text,
        rating: data.rating ? Number(data.rating) : undefined,
      }),
    {
      onSuccess: () => {
        qc.invalidateQueries('matches')
        setSuccess(true)
      },
    },
  )

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
          <CheckCircle className="mx-auto w-12 h-12 text-green-500 mb-4" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Feedback Submitted</h2>
          <p className="text-sm text-gray-500 mb-6">Thank you for your feedback!</p>
          <button
            onClick={onClose}
            className="rounded-xl bg-[#093344] hover:bg-[#0D9488] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 disabled:opacity-50"
          >
            Close
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
            <h2 className="text-base font-bold text-gray-900">Submit Feedback</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {match.topic ? `Topic: ${match.topic}` : `Match with ${match.mentor_name}`}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
          {/* Star rating */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Rating (optional)</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <label key={n} className="cursor-pointer">
                  <input
                    type="radio"
                    value={n}
                    {...register('rating')}
                    className="sr-only"
                  />
                  <Star
                    className={`w-7 h-7 transition-colors ${
                      Number(rating) >= n ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
                    }`}
                  />
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Feedback <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('feedback_text', { required: 'Feedback is required' })}
              rows={5}
              placeholder="Share your experience with this mentorship…"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] hover:border-gray-300 resize-none"
            />
            {errors.feedback_text && (
              <p className="mt-1 text-xs text-red-600">{errors.feedback_text.message}</p>
            )}
          </div>

          {mutation.isError && (
            <p className="text-xs text-red-600">Something went wrong. Please try again.</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 bg-white text-gray-700 hover:border-[#0D9488] hover:text-[#0D9488] px-4 py-2.5 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-[#093344] hover:bg-[#0D9488] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 disabled:opacity-50"
            >
              {mutation.isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Request Mentorship Button + Modal ─────────────────────────────────────────

interface NewRequestForm {
  topic: string
  message: string
}

function NewRequestModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [success, setSuccess] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<NewRequestForm>()

  const mutation = useMutation(
    (data: NewRequestForm) => mentorshipApi.createRequest(data),
    {
      onSuccess: () => {
        qc.invalidateQueries('my-requests')
        setSuccess(true)
      },
    },
  )

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
          <CheckCircle className="mx-auto w-12 h-12 text-green-500 mb-4" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Request Submitted</h2>
          <p className="text-sm text-gray-500 mb-6">An admin will review and match you with a mentor soon.</p>
          <button
            onClick={onClose}
            className="rounded-xl bg-[#093344] hover:bg-[#0D9488] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 disabled:opacity-50"
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
          <h2 className="text-base font-bold text-gray-900">New Mentorship Request</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Topic <span className="text-red-500">*</span>
            </label>
            <input
              {...register('topic', { required: 'Topic is required' })}
              placeholder="e.g. Environmental data analysis"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] hover:border-gray-300"
            />
            {errors.topic && (
              <p className="mt-1 text-xs text-red-600">{errors.topic.message}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Message</label>
            <textarea
              {...register('message')}
              rows={4}
              placeholder="Tell us what you're looking for in a mentor…"
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
              className="rounded-xl border border-gray-200 bg-white text-gray-700 hover:border-[#0D9488] hover:text-[#0D9488] px-4 py-2.5 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-[#093344] hover:bg-[#0D9488] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 disabled:opacity-50"
            >
              {mutation.isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Match Card ────────────────────────────────────────────────────────────────

function MatchCard({
  match,
  role,
  onFeedback,
}: {
  match: MentorshipMatch
  role: string
  onFeedback: (m: MentorshipMatch) => void
}) {
  const otherParty = role === 'mentor' ? match.mentee_name : match.mentor_name
  const otherEmail = role === 'mentor' ? match.mentee_email : match.mentor_email
  const canFeedback = match.status === 'completed'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-gray-900">{match.topic ?? 'Mentorship'}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {role === 'mentor' ? 'Mentee: ' : 'Mentor: '}
            <span className="text-gray-700">{otherParty}</span>
            <span className="text-gray-400"> · {otherEmail}</span>
          </p>
        </div>
        <StatusBadge
          label={MENTORSHIP_MATCH_STATUS_LABELS[match.status]}
          style={MATCH_STATUS_STYLES[match.status]}
        />
      </div>

      {match.notes && (
        <p className="text-xs text-gray-500 italic">{match.notes}</p>
      )}

      <div className="flex items-center gap-4 text-xs text-gray-400">
        {match.start_date && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> Started {new Date(match.start_date).toLocaleDateString()}
          </span>
        )}
        {match.matched_by_name && (
          <span>Matched by {match.matched_by_name}</span>
        )}
      </div>

      {canFeedback && (
        <button
          onClick={() => onFeedback(match)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline"
        >
          <MessageSquare className="w-3.5 h-3.5" /> Submit Feedback
        </button>
      )}
    </div>
  )
}

// ── Youth / Researcher View ───────────────────────────────────────────────────

function MenteeView() {
  const [tab, setTab] = useState<'requests' | 'matches'>('requests')
  const [showNewRequest, setShowNewRequest] = useState(false)
  const [feedbackMatch, setFeedbackMatch] = useState<MentorshipMatch | null>(null)

  const { data: requestsData, isLoading: loadingReqs } = useQuery(
    'my-requests',
    () => mentorshipApi.listRequests().then((r) => r.data),
  )

  const { data: matchesData, isLoading: loadingMatches } = useQuery(
    'matches',
    () => mentorshipApi.listMatches().then((r) => r.data),
  )

  return (
    <div className="space-y-6">
      {/* Tabs + action */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {(['requests', 'matches'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'requests' ? 'My Requests' : 'My Matches'}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowNewRequest(true)}
          className="rounded-xl bg-[#093344] hover:bg-[#0D9488] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 disabled:opacity-50"
        >
          + New Request
        </button>
      </div>

      {/* Content */}
      {tab === 'requests' && (
        <div className="space-y-3">
          {loadingReqs ? (
            <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-gray-300" /></div>
          ) : !requestsData?.results.length ? (
            <div className="py-12 text-center text-sm text-gray-400">
              No requests yet. Click "New Request" to get started.
            </div>
          ) : (
            requestsData.results.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{req.topic}</p>
                    {req.preferred_mentor_name && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        Preferred mentor: {req.preferred_mentor_name}
                      </p>
                    )}
                    {req.message && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{req.message}</p>
                    )}
                  </div>
                  <StatusBadge
                    label={MENTORSHIP_REQUEST_STATUS_LABELS[req.status]}
                    style={REQUEST_STATUS_STYLES[req.status]}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  Submitted {new Date(req.created_at).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'matches' && (
        <div className="space-y-3">
          {loadingMatches ? (
            <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-gray-300" /></div>
          ) : !matchesData?.results.length ? (
            <div className="py-12 text-center text-sm text-gray-400">
              No matches yet. Submit a request and an admin will match you with a mentor.
            </div>
          ) : (
            matchesData.results.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                role="mentee"
                onFeedback={setFeedbackMatch}
              />
            ))
          )}
        </div>
      )}

      {showNewRequest && <NewRequestModal onClose={() => setShowNewRequest(false)} />}
      {feedbackMatch && (
        <FeedbackModal match={feedbackMatch} onClose={() => setFeedbackMatch(null)} />
      )}
    </div>
  )
}

// ── Mentor View ───────────────────────────────────────────────────────────────

function MentorView() {
  const [tab, setTab] = useState<'requests' | 'matches'>('matches')
  const [feedbackMatch, setFeedbackMatch] = useState<MentorshipMatch | null>(null)

  const { data: requestsData, isLoading: loadingReqs } = useQuery(
    'mentor-incoming-requests',
    () => mentorshipApi.listRequests().then((r) => r.data),
  )

  const { data: matchesData, isLoading: loadingMatches } = useQuery(
    'matches',
    () => mentorshipApi.listMatches().then((r) => r.data),
  )

  return (
    <div className="space-y-6">
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(['matches', 'requests'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'matches' ? 'My Matches' : 'Incoming Requests'}
          </button>
        ))}
      </div>

      {tab === 'matches' && (
        <div className="space-y-3">
          {loadingMatches ? (
            <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-gray-300" /></div>
          ) : !matchesData?.results.length ? (
            <div className="py-12 text-center text-sm text-gray-400">No active matches yet.</div>
          ) : (
            matchesData.results.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                role="mentor"
                onFeedback={setFeedbackMatch}
              />
            ))
          )}
        </div>
      )}

      {tab === 'requests' && (
        <div className="space-y-3">
          {loadingReqs ? (
            <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-gray-300" /></div>
          ) : !requestsData?.results.length ? (
            <div className="py-12 text-center text-sm text-gray-400">
              No incoming requests from mentees.
            </div>
          ) : (
            requestsData.results.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{req.topic}</p>
                    <p className="text-xs text-gray-500 mt-0.5">From: {req.mentee_name}</p>
                    {req.message && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2 italic">{req.message}</p>
                    )}
                  </div>
                  <StatusBadge
                    label={MENTORSHIP_REQUEST_STATUS_LABELS[req.status]}
                    style={REQUEST_STATUS_STYLES[req.status]}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  {new Date(req.created_at).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {feedbackMatch && (
        <FeedbackModal match={feedbackMatch} onClose={() => setFeedbackMatch(null)} />
      )}
    </div>
  )
}

// ── Partner / RA View ─────────────────────────────────────────────────────────

function PartnerView({ role }: { role: string }) {
  const { data: profile } = useQuery(
    'partner-profile',
    () => authApi.getPartnerProfile().then((r) => r.data),
    { enabled: role === 'industry_partner' },
  )
  const { data: raProfile } = useQuery(
    'ra-profile',
    () => authApi.getAssistantProfile().then((r) => r.data),
    { enabled: role === 'research_assistant' },
  )

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Users className="w-5 h-5 text-blue-600" />
        <h2 className="text-base font-bold text-gray-900">
          {role === 'industry_partner' ? 'Partner Network' : 'Research Assistant Network'}
        </h2>
      </div>

      {role === 'industry_partner' && profile && (
        <div className="space-y-2 text-sm">
          <div className="flex gap-4">
            <div>
              <p className="text-xs text-gray-400">Organisation</p>
              <p className="font-medium text-gray-800">{profile.org_name || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Type</p>
              <p className="font-medium text-gray-800 capitalize">{profile.partner_type}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Sector</p>
              <p className="font-medium text-gray-800">{profile.sector || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Verified</p>
              <p className={profile.is_verified ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}>
                {profile.is_verified ? 'Verified' : 'Pending'}
              </p>
            </div>
          </div>
          {!profile.is_verified && (
            <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
              Your partner profile is pending verification by an admin. Once verified, your organisation will appear in the partner directory.
            </p>
          )}
        </div>
      )}

      {role === 'research_assistant' && raProfile && (
        <div className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400">Skills</p>
              <p className="text-gray-800">{raProfile.skills || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Availability</p>
              <p className="text-gray-800">{raProfile.availability || '—'}</p>
            </div>
          </div>
          {raProfile.portfolio && (
            <div>
              <p className="text-xs text-gray-400">Portfolio</p>
              <p className="text-gray-800 text-xs">{raProfile.portfolio}</p>
            </div>
          )}
        </div>
      )}

      <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-sm text-blue-800">
        To explore collaboration opportunities, browse{' '}
        <a href="/research" className="underline font-medium">research publications</a> and{' '}
        <a href="/events" className="underline font-medium">events</a>.
        For direct collaboration interest, contact{' '}
        <a href="mailto:info@yriftz.org" className="underline font-medium">info@yriftz.org</a>.
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function MyMentorship() {
  const { user } = useAuth()

  if (!user) return null

  const isMentor = user.role === 'mentor'
  const isPartnerOrRA = user.role === 'industry_partner' || user.role === 'research_assistant'

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isMentor ? 'Mentor Dashboard' : isPartnerOrRA ? 'Partner Network' : 'My Mentorship'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isMentor
            ? 'Manage your mentee matches and incoming requests.'
            : isPartnerOrRA
            ? 'View your partner/RA profile and explore collaboration opportunities.'
            : 'Track your mentorship requests and active matches.'}
        </p>
      </div>

      {isMentor && <MentorView />}
      {isPartnerOrRA && <PartnerView role={user.role} />}
      {!isMentor && !isPartnerOrRA && <MenteeView />}
    </div>
  )
}
