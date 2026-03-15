import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import {
  Calendar, MapPin, Globe, Users, ArrowLeft, Loader2,
  CheckCircle, Trophy, Clock, AlertCircle,
} from 'lucide-react'
import { eventsApi } from '@/api/events'
import { researchApi } from '@/api/research'
import { useAuth } from '@/hooks/useAuth'
import { EVENT_TYPE_LABELS } from '@/types/events'

export default function EventDetail() {
  const { id } = useParams<{ id: string }>()
  const { isAuthenticated, isApproved } = useAuth()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [selectedResearch, setSelectedResearch] = useState('')

  const { data: event, isLoading } = useQuery(
    ['event', id],
    () => eventsApi.get(id!).then((r) => r.data),
    { enabled: !!id },
  )

  useEffect(() => {
    document.title = event ? `YRIF – ${event.title}` : 'YRIF – Event'
    return () => { document.title = 'YRIF – Youth Research & Innovation Foundation' }
  }, [event])

  const { data: winners } = useQuery(
    ['event-winners', id],
    () => eventsApi.getWinners(id!).then((r) => r.data),
    { enabled: !!id && event?.event_type === 'competition' },
  )

  const { data: myResearch } = useQuery(
    'my-research-for-event',
    () => researchApi.myResearch().then((r) => r.data),
    { enabled: !!isAuthenticated && event?.event_type === 'competition' },
  )

  const { data: myRegistrations } = useQuery(
    'my-registrations',
    () => eventsApi.myRegistrations().then((r) => r.data),
    { enabled: !!isAuthenticated },
  )

  const myRegistration = myRegistrations?.results.find((r) => r.event === id)
  const isRegistered = !!myRegistration && myRegistration.status !== 'cancelled'

  const registerMutation = useMutation(
    () =>
      eventsApi.register(id!, {
        research_submission: selectedResearch || undefined,
      }),
    {
      onSuccess: () => {
        qc.invalidateQueries('my-registrations')
        qc.invalidateQueries(['event', id])
      },
    },
  )

  const unregisterMutation = useMutation(
    () => eventsApi.unregister(id!),
    {
      onSuccess: () => {
        qc.invalidateQueries('my-registrations')
        qc.invalidateQueries(['event', id])
      },
    },
  )

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center text-gray-400">
        Event not found.
      </div>
    )
  }

  const isPast = new Date(event.end_date) < new Date()
  const isCompetition = event.event_type === 'competition'

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4">
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-50 text-blue-700">
            {isCompetition && <Trophy className="w-3 h-3" />}
            {EVENT_TYPE_LABELS[event.event_type]}
          </span>
          {isPast && (
            <span className="inline-flex rounded-full px-2 py-0.5 text-xs bg-gray-100 text-gray-500 font-medium">
              Past
            </span>
          )}
          {!isPast && event.is_registration_open && (
            <span className="inline-flex rounded-full px-2 py-0.5 text-xs bg-green-50 text-green-700 font-medium">
              Registration Open
            </span>
          )}
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-3">{event.title}</h1>
        <p className="text-sm text-gray-600 leading-relaxed mb-5">{event.description}</p>

        {/* Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-500">
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
            <div>
              <div>{new Date(event.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              <div className="text-xs text-gray-400">
                {new Date(event.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {' – '}
                {new Date(event.end_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>{event.location}</span>
            </div>
          )}
          {event.is_online && (
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" />
              {event.online_link ? (
                <a href={event.online_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                  Join Online
                </a>
              ) : (
                <span className="text-blue-600">Online Event</span>
              )}
            </div>
          )}
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span>
              {event.registrations_count}
              {event.max_participants ? ` / ${event.max_participants}` : ''} registered
            </span>
          </div>
          {event.registration_deadline && !isPast && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-amber-600 text-xs">
                Registration deadline: {new Date(event.registration_deadline).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Registration panel */}
      {!isPast && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-4">
          {!isAuthenticated ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Log in to register for this event.</p>
              <Link
                to="/login"
                className="rounded-xl bg-[#093344] hover:bg-[#0D9488] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200"
              >
                Log In
              </Link>
            </div>
          ) : !isApproved ? (
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <AlertCircle className="w-4 h-4" />
              Your account must be approved to register for events.
            </div>
          ) : isRegistered ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle className="w-4 h-4" />
                You are registered for this event.
              </div>
              <button
                type="button"
                onClick={() => unregisterMutation.mutate()}
                disabled={unregisterMutation.isLoading}
                className="text-xs text-red-500 hover:underline disabled:opacity-50"
              >
                {unregisterMutation.isLoading ? 'Cancelling…' : 'Cancel Registration'}
              </button>
            </div>
          ) : event.is_registration_open ? (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Register for this Event</h3>

              {/* Competition: link a research submission */}
              {isCompetition && (
                <div className="mb-4">
                  <label htmlFor="research-select" className="block text-xs font-medium text-gray-600 mb-1">
                    Link Research Submission (optional)
                  </label>
                  <select
                    id="research-select"
                    value={selectedResearch}
                    onChange={(e) => setSelectedResearch(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] hover:border-gray-300"
                  >
                    <option value="">No submission selected</option>
                    {myResearch?.results
                      .filter((r) => r.status === 'published' || r.status === 'approved')
                      .map((r) => (
                        <option key={r.id} value={r.id}>{r.title}</option>
                      ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    Only published or approved research can be submitted to competitions.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => registerMutation.mutate()}
                disabled={registerMutation.isLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-[#093344] hover:bg-[#0D9488] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 disabled:opacity-50"
              >
                {registerMutation.isLoading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <CheckCircle className="w-4 h-4" />}
                Register Now
              </button>

              {registerMutation.isError && (
                <p className="text-xs text-red-500 mt-2">Registration failed. Please try again.</p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <AlertCircle className="w-4 h-4" />
              Registration is now closed for this event.
            </div>
          )}
        </div>
      )}

      {/* Winners (competitions) */}
      {isCompetition && winners && winners.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" /> Competition Winners
          </h2>
          <div className="space-y-2">
            {winners.map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between rounded-lg bg-amber-50 border border-amber-100 px-3 py-2.5"
              >
                <div>
                  <span className="text-sm font-semibold text-amber-800">{w.rank}</span>
                  <span className="text-sm text-gray-600 ml-2">— {w.participant_name}</span>
                  {w.research_title && (
                    <p className="text-xs text-gray-400 mt-0.5 italic">{w.research_title}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
