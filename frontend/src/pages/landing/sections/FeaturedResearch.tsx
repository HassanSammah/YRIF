import { Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import { BookOpen, User, ArrowRight, Eye, Download } from 'lucide-react'
import { publicApi } from '@/api/public'
import { SkeletonCard } from '@/components/common/Skeleton'
import { RESEARCH_CATEGORY_LABELS } from '@/types/research'
import type { Research } from '@/types/research'

export default function FeaturedResearch() {
  const { data, isLoading } = useQuery(
    'landing:featured-research',
    () => publicApi.getFeaturedResearch(3).then((r) => r.data.results ?? r.data),
    { staleTime: 5 * 60_000, retry: false }
  )

  const items: Research[] = Array.isArray(data) ? data : (data as unknown as { results?: Research[] })?.results ?? []

  return (
    <section id="research" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <div className="inline-block text-xs font-semibold text-brand-teal bg-brand-teal/10 px-3 py-1.5 rounded-full border border-brand-teal/20 mb-3">
              Research Spotlight
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-navy">
              Featured Research
            </h2>
            <p className="mt-2 text-content-secondary">
              Peer-reviewed work from Tanzania's brightest young researchers.
            </p>
          </div>
          <Link
            to="/dashboard"
            className="flex-shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-teal hover:underline"
          >
            View all research <ArrowRight size={14} />
          </Link>
        </div>

        {/* Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => <SkeletonCard key={i} rows={4} />)}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-content-secondary">
            <BookOpen size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No published research yet — be the first to contribute!</p>
            <Link
              to="/register"
              className="mt-4 inline-block text-sm font-semibold text-brand-teal hover:underline"
            >
              Join and Submit Research →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {items.map((r) => (
              <Link
                key={r.id}
                to="/dashboard"
                className="group flex flex-col glass-card bg-white rounded-2xl p-5 hover:-translate-y-1 transition-transform"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold bg-brand-teal/10 text-brand-teal px-2.5 py-1 rounded-full">
                    {RESEARCH_CATEGORY_LABELS[r.category as keyof typeof RESEARCH_CATEGORY_LABELS] ?? r.category}
                  </span>
                </div>
                <h3 className="font-semibold text-brand-navy text-sm leading-snug mb-2 group-hover:text-brand-teal transition-colors line-clamp-2">
                  {r.title}
                </h3>
                <p className="text-xs text-content-secondary leading-relaxed line-clamp-3 flex-1">
                  {r.abstract}
                </p>
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-content-secondary">
                  <div className="flex items-center gap-1.5">
                    <User size={12} />
                    <span className="truncate max-w-[120px]">{r.author_name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><Eye size={11} />{r.views_count}</span>
                    <span className="flex items-center gap-1"><Download size={11} />{r.downloads_count}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
