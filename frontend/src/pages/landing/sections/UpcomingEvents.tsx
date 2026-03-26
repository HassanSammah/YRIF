import { Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import { Calendar, MapPin, Users, ArrowRight, Wifi } from 'lucide-react'
import { publicApi } from '@/api/public'
import { SkeletonCard } from '@/components/common/Skeleton'
import { EVENT_TYPE_LABELS } from '@/types/events'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-TZ', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

const TYPE_COLORS: Record<string, string> = {
  seminar:     'bg-blue-50 text-blue-700',
  workshop:    'bg-brand-teal/10 text-brand-teal',
  bonanza:     'bg-brand-gold/10 text-brand-gold',
  competition: 'bg-purple-50 text-purple-700',
  webinar:     'bg-green-50 text-green-700',
}

export default function UpcomingEvents() {
  const { data, isLoading } = useQuery(
    'landing:events',
    () => publicApi.getEvents(3).then((r) => r.data.results ?? r.data),
    { staleTime: 5 * 60_000, retry: false }
  )

  const items = Array.isArray(data) ? data : (data as any)?.results ?? []

  return (
    <section id="events" className="py-20 bg-gradient-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <div className="inline-block text-xs font-semibold text-brand-gold bg-brand-gold/10 px-3 py-1.5 rounded-full border border-brand-gold/20 mb-3">
              Upcoming Events
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-navy">
              Events & Competitions
            </h2>
            <p className="mt-2 text-content-secondary">
              Seminars, workshops, hackathons, and more — all in one place.
            </p>
          </div>
          <Link
            to="/dashboard"
            className="flex-shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-teal hover:underline"
          >
            All events <ArrowRight size={14} />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => <SkeletonCard key={i} rows={4} />)}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-content-secondary">
            <Calendar size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No upcoming events at the moment. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {items.map((ev: any) => (
              <Link
                key={ev.id}
                to="/dashboard"
                className="group flex flex-col glass-card bg-white rounded-2xl p-5 hover:-translate-y-1 transition-transform"
              >
                {/* Type badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${TYPE_COLORS[ev.event_type] ?? 'bg-gray-100 text-gray-600'}`}>
                    {EVENT_TYPE_LABELS[ev.event_type as keyof typeof EVENT_TYPE_LABELS] ?? ev.event_type}
                  </span>
                  {ev.is_online && (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <Wifi size={11} /> Online
                    </span>
                  )}
                </div>

                <h3 className="font-semibold text-brand-navy text-sm leading-snug mb-3 group-hover:text-brand-teal transition-colors line-clamp-2">
                  {ev.title}
                </h3>

                <p className="text-xs text-content-secondary line-clamp-2 flex-1 leading-relaxed">
                  {ev.description}
                </p>

                <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-content-secondary">
                    <Calendar size={12} className="text-brand-teal flex-shrink-0" />
                    <span>{formatDate(ev.start_date)}</span>
                  </div>
                  {!ev.is_online && ev.location && (
                    <div className="flex items-center gap-2 text-xs text-content-secondary">
                      <MapPin size={12} className="text-brand-gold flex-shrink-0" />
                      <span className="truncate">{ev.location}</span>
                    </div>
                  )}
                  {ev.max_participants && (
                    <div className="flex items-center gap-2 text-xs text-content-secondary">
                      <Users size={12} className="flex-shrink-0" />
                      <span>{ev.registrations_count}/{ev.max_participants} registered</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
