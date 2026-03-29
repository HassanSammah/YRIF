import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import { Calendar, MapPin, ArrowRight, Clock } from 'lucide-react'
import { publicApi } from '@/api/public'
import { SkeletonCard } from '@/components/common/Skeleton'
import { EVENT_TYPE_LABELS } from '@/types/events'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-TZ', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function useCountdown(targetDate: string | null) {
  const [time, setTime] = useState({ days: 0, hours: 0, mins: 0 })

  useEffect(() => {
    if (!targetDate) return
    const tick = () => {
      const diff = new Date(targetDate).getTime() - Date.now()
      if (diff <= 0) { setTime({ days: 0, hours: 0, mins: 0 }); return }
      setTime({
        days: Math.floor(diff / 86_400_000),
        hours: Math.floor((diff % 86_400_000) / 3_600_000),
        mins: Math.floor((diff % 3_600_000) / 60_000),
      })
    }
    tick()
    const id = setInterval(tick, 60_000)
    return () => clearInterval(id)
  }, [targetDate])

  return time
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

  const items: any[] = Array.isArray(data) ? data : (data as any)?.results ?? []
  const nextEvent = items[0] ?? null
  const countdown = useCountdown(nextEvent?.start_date ?? null)

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
            to="/events"
            className="flex-shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-teal hover:underline"
          >
            All events <ArrowRight size={14} />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">{[0, 1, 2].map((i) => <SkeletonCard key={i} rows={3} />)}</div>
            <SkeletonCard rows={6} />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-content-secondary">
            <Calendar size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No upcoming events at the moment. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Events list */}
            <div className="space-y-4">
              {items.map((ev: any) => (
                <Link
                  key={ev.id}
                  to={`/events/${ev.id}`}
                  className="group flex gap-4 glass-card bg-white rounded-2xl p-5 hover:-translate-y-0.5 transition-transform"
                >
                  {/* Date badge */}
                  <div className="flex-shrink-0 w-14 text-center">
                    <div className="bg-brand-navy rounded-xl py-2 px-1">
                      <p className="text-brand-gold font-bold text-lg leading-none">
                        {new Date(ev.start_date).getDate()}
                      </p>
                      <p className="text-white/70 text-[10px] uppercase mt-0.5">
                        {new Date(ev.start_date).toLocaleString('en', { month: 'short' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[ev.event_type] ?? 'bg-gray-100 text-gray-600'}`}>
                        {EVENT_TYPE_LABELS[ev.event_type as keyof typeof EVENT_TYPE_LABELS] ?? ev.event_type}
                      </span>
                    </div>
                    <h3 className="font-semibold text-brand-navy text-sm leading-snug group-hover:text-brand-teal transition-colors line-clamp-1">
                      {ev.title}
                    </h3>
                    <div className="mt-2 flex items-center gap-3 text-xs text-content-secondary">
                      {!ev.is_online && ev.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={11} className="text-brand-gold" />{ev.location}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0 self-center">
                    <span className="text-xs font-semibold text-brand-teal bg-brand-teal/10 px-3 py-1.5 rounded-lg whitespace-nowrap">
                      Register Now
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Next event info card */}
            {nextEvent && (
              <div className="bg-brand-navy rounded-3xl p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-brand-teal/20 rounded-full blur-2xl pointer-events-none" />
                <div className="relative">
                  <div className="inline-flex items-center gap-2 bg-brand-gold/20 text-brand-gold px-3 py-1.5 rounded-full text-xs font-semibold mb-4">
                    <Clock size={12} /> Next Event
                  </div>
                  <h3 className="font-display text-xl font-bold mb-2 line-clamp-2">{nextEvent.title}</h3>
                  <p className="text-white/60 text-sm mb-6 line-clamp-2">{nextEvent.description}</p>

                  {/* Countdown */}
                  <div className="flex gap-3 mb-6">
                    {[
                      { value: countdown.days, label: 'Days' },
                      { value: countdown.hours, label: 'Hrs' },
                      { value: countdown.mins, label: 'Mins' },
                    ].map(({ value, label }) => (
                      <div key={label} className="flex-1 bg-white/10 rounded-xl p-3 text-center">
                        <p className="font-display text-2xl font-bold">{String(value).padStart(2, '0')}</p>
                        <p className="text-white/60 text-xs mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-white/70 mb-6">
                    <Calendar size={14} />
                    <span>{formatDate(nextEvent.start_date)}</span>
                    {!nextEvent.is_online && nextEvent.location && (
                      <>
                        <span className="text-white/30">·</span>
                        <MapPin size={14} />
                        <span className="truncate">{nextEvent.location}</span>
                      </>
                    )}
                  </div>

                  <Link
                    to={`/events/${nextEvent.id}`}
                    className="block w-full text-center bg-brand-gold text-white font-semibold py-3 rounded-xl hover:bg-brand-gold/90 transition-colors"
                  >
                    Register Now
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
