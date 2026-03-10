import { useState } from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import {
  Search, Calendar, MapPin, Globe, Users, Filter,
  ChevronLeft, ChevronRight, Loader2, Trophy,
} from 'lucide-react'
import { eventsApi } from '@/api/events'
import { EVENT_TYPE_LABELS } from '@/types/events'
import type { EventType } from '@/types/events'

const TYPE_COLORS: Record<EventType, string> = {
  seminar: 'bg-blue-50 text-blue-700',
  workshop: 'bg-purple-50 text-purple-700',
  bonanza: 'bg-orange-50 text-orange-700',
  competition: 'bg-emerald-50 text-emerald-700',
  webinar: 'bg-sky-50 text-sky-700',
}

const EVENT_TYPES: { value: EventType | ''; label: string }[] = [
  { value: '', label: 'All Types' },
  { value: 'seminar', label: 'Seminars' },
  { value: 'workshop', label: 'Workshops' },
  { value: 'bonanza', label: 'Bonanzas' },
  { value: 'competition', label: 'Competitions' },
  { value: 'webinar', label: 'Webinars' },
]

export default function EventsList() {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<EventType | ''>('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery(
    ['events', search, typeFilter, page],
    () =>
      eventsApi
        .list({ search: search || undefined, event_type: typeFilter || undefined, page })
        .then((r) => r.data),
    { keepPreviousData: true },
  )

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const totalPages = data ? Math.ceil(data.count / 20) : 1

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Events & Programmes</h1>
        <p className="text-sm text-gray-500 mt-1">
          Discover and register for YRIF events, workshops, and competitions
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
                placeholder="Search events…"
                className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Search
            </button>
          </form>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value as EventType | ''); setPage(1) }}
              aria-label="Filter by event type"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : !data?.results.length ? (
        <div className="text-center py-20 text-gray-400">
          <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No events found.</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400 mb-4">
            {data.count} event{data.count !== 1 ? 's' : ''}
          </p>

          <div className="space-y-4">
            {data.results.map((event) => {
              const isPast = new Date(event.end_date) < new Date()
              return (
                <div
                  key={event.id}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-blue-200 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_COLORS[event.event_type]}`}>
                          {event.event_type === 'competition' && <Trophy className="w-3 h-3" />}
                          {EVENT_TYPE_LABELS[event.event_type]}
                        </span>
                        {isPast && (
                          <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500">
                            Past
                          </span>
                        )}
                        {!isPast && event.is_registration_open && (
                          <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-green-50 text-green-700">
                            Open
                          </span>
                        )}
                      </div>

                      <Link
                        to={`/events/${event.id}`}
                        className="text-base font-semibold text-gray-900 hover:text-blue-700 block line-clamp-1"
                      >
                        {event.title}
                      </Link>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{event.description}</p>

                      <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(event.start_date).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" /> {event.location}
                          </span>
                        )}
                        {event.is_online && (
                          <span className="flex items-center gap-1.5 text-blue-500">
                            <Globe className="w-3.5 h-3.5" /> Online
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          {event.registrations_count}
                          {event.max_participants ? ` / ${event.max_participants}` : ''} registered
                        </span>
                      </div>
                    </div>

                    <Link
                      to={`/events/${event.id}`}
                      className="flex-shrink-0 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100 whitespace-nowrap"
                    >
                      View
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>

          {data.count > 20 && (
            <div className="flex items-center justify-between mt-6 text-sm text-gray-500">
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
        </>
      )}
    </div>
  )
}
