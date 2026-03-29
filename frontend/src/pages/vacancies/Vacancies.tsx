import { useState } from 'react'
import { useQuery } from 'react-query'
import { Search, MapPin, Clock, Briefcase, Calendar } from 'lucide-react'
import { publicApi, type Vacancy } from '@/api/public'
import { SkeletonCard } from '@/components/common/Skeleton'

const TYPE_LABELS: Record<string, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
}

const TYPE_COLORS: Record<string, string> = {
  full_time: 'bg-brand-teal/10 text-brand-teal',
  part_time: 'bg-blue-50 text-blue-700',
  contract: 'bg-brand-gold/10 text-brand-gold',
  internship: 'bg-purple-50 text-purple-700',
}

const FILTERS = ['All', 'Full-time', 'Part-time', 'Contract', 'Internship']

export default function Vacancies() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')

  const { data, isLoading } = useQuery(
    'public:vacancies',
    () => publicApi.getVacancies().then((r) => r.data),
    { staleTime: 10 * 60_000, retry: false }
  )

  const items: Vacancy[] = Array.isArray(data) ? data : []

  const filtered = items.filter((v) => {
    const matchesSearch =
      v.title.toLowerCase().includes(search.toLowerCase()) ||
      v.location.toLowerCase().includes(search.toLowerCase())
    const matchesFilter =
      filter === 'All' || TYPE_LABELS[v.type] === filter
    return matchesSearch && matchesFilter
  })

  return (
    <div className="min-h-screen bg-gradient-cream pt-16">
      {/* Hero */}
      <div className="bg-brand-navy text-white py-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-teal/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-gold/20 text-brand-gold px-3 py-1.5 rounded-full text-xs font-semibold mb-6">
            <Briefcase size={13} /> Work With Us
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4">
            Career Opportunities at YRIF
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Join our mission to empower Tanzanian youth through research and innovation.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-secondary" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or location..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal bg-white"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  filter === f
                    ? 'bg-brand-navy text-white border-brand-navy'
                    : 'bg-white text-content-secondary border-gray-200 hover:border-brand-navy hover:text-brand-navy'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} rows={4} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-content-secondary">
            <Briefcase size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No vacancies found</p>
            <p className="text-sm mt-1">
              {items.length === 0
                ? 'No open positions at the moment. Check back soon!'
                : 'Try adjusting your search or filter.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((v) => (
              <div key={v.id} className="glass-card bg-white rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-brand-navy text-base leading-snug">{v.title}</h3>
                    <div className="flex items-center gap-3 mt-2 text-sm text-content-secondary">
                      <span className="flex items-center gap-1">
                        <MapPin size={13} className="text-brand-gold" /> {v.location}
                      </span>
                    </div>
                  </div>
                  <span className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${TYPE_COLORS[v.type] ?? 'bg-gray-100 text-gray-600'}`}>
                    {TYPE_LABELS[v.type] ?? v.type}
                  </span>
                </div>

                <p className="text-sm text-content-secondary leading-relaxed line-clamp-3">
                  {v.description}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 text-xs text-content-secondary">
                    <Calendar size={13} className="text-brand-teal" />
                    Deadline: {new Date(v.deadline).toLocaleDateString('en-TZ', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                  <a
                    href="mailto:info@yriftz.org"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-teal hover:underline"
                  >
                    <Clock size={12} /> Apply Now
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
