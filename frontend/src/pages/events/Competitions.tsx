import { useState } from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import {
  Trophy, Calendar, MapPin, Users, Search,
  ChevronLeft, ChevronRight, Loader2,
} from 'lucide-react'
import { eventsApi } from '@/api/events'

export default function Competitions() {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery(
    ['competitions', search, page],
    () =>
      eventsApi
        .list({ event_type: 'competition', search: search || undefined, page })
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
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="w-7 h-7 text-amber-500" />
          <h1 className="text-2xl font-bold text-gray-900">Competitions</h1>
        </div>
        <p className="text-sm text-gray-500">
          Submit your research and compete with top young innovators across Tanzania
        </p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search competitions…"
              className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] hover:border-gray-300"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-[#093344] hover:bg-[#0D9488] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200"
          >
            Search
          </button>
        </form>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : !data?.results.length ? (
        <div className="text-center py-20 text-gray-400">
          <Trophy className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No competitions found.</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400 mb-4">
            {data.count} competition{data.count !== 1 ? 's' : ''}
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {data.results.map((comp) => {
              const isPast = new Date(comp.end_date) < new Date()
              return (
                <div
                  key={comp.id}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col hover:border-amber-200 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <Trophy className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="flex gap-1.5 flex-shrink-0">
                      {isPast ? (
                        <span className="inline-flex rounded-full px-2 py-0.5 text-xs bg-gray-100 text-gray-500 font-medium">
                          Ended
                        </span>
                      ) : comp.is_registration_open ? (
                        <span className="inline-flex rounded-full px-2 py-0.5 text-xs bg-green-50 text-green-700 font-medium">
                          Open
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full px-2 py-0.5 text-xs bg-amber-50 text-amber-700 font-medium">
                          Closed
                        </span>
                      )}
                    </div>
                  </div>

                  <Link
                    to={`/events/${comp.id}`}
                    className="text-base font-semibold text-gray-900 hover:text-[#0D9488] mb-2 block line-clamp-2"
                  >
                    {comp.title}
                  </Link>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">{comp.description}</p>

                  <div className="flex flex-wrap gap-3 text-xs text-gray-400 mb-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(comp.start_date).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </span>
                    {comp.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {comp.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {comp.registrations_count}
                      {comp.max_participants ? ` / ${comp.max_participants}` : ''} entries
                    </span>
                  </div>

                  <Link
                    to={`/events/${comp.id}`}
                    className="mt-auto inline-flex justify-center items-center rounded-xl bg-[#093344] hover:bg-[#0D9488] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200"
                  >
                    {comp.is_registration_open ? 'Enter Competition' : 'View Details'}
                  </Link>
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
