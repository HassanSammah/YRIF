import { useState } from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import {
  Search, BookOpen, Download, Eye, Filter,
  ChevronLeft, ChevronRight, ChevronDown,
} from 'lucide-react'
import { researchApi } from '@/api/research'
import { RESEARCH_CATEGORY_LABELS } from '@/types/research'
import type { ResearchCategory } from '@/types/research'
import { SkeletonResearchCard } from '@/components/common/Skeleton'
import { usePageTitle } from '@/hooks/usePageTitle'

const CATEGORIES: { value: ResearchCategory | ''; label: string }[] = [
  { value: '', label: 'All Categories' },
  { value: 'natural_sciences', label: 'Natural Sciences' },
  { value: 'social_sciences', label: 'Social Sciences' },
  { value: 'arts', label: 'Arts & Humanities' },
  { value: 'technology', label: 'Technology & Engineering' },
]

export default function ResearchRepository() {
  usePageTitle('Research Repository')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<ResearchCategory | ''>('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery(
    ['research-public', search, category, page],
    () =>
      researchApi
        .list({ search: search || undefined, category: category || undefined, page })
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#093344]">Research Repository</h1>
        <p className="text-sm text-gray-500 mt-1">
          Explore published research and innovations from Tanzanian youth
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
                placeholder="Search title, abstract, keywords…"
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

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <div className="relative">
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value as ResearchCategory | ''); setPage(1) }}
                aria-label="Filter by category"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] hover:border-gray-300 appearance-none pr-10 cursor-pointer"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonResearchCard key={i} />)}
        </div>
      ) : !data?.results.length ? (
        <div className="text-center py-20 text-gray-400">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No published research found.</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400 mb-4">
            {data.count} result{data.count !== 1 ? 's' : ''}
          </p>

          <div className="space-y-4">
            {data.results.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-[#0D9488]/40 transition-colors card-lift"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-teal-50 text-[#0D9488]">
                        {RESEARCH_CATEGORY_LABELS[r.category]}
                      </span>
                    </div>

                    <Link
                      to={`/research/${r.id}`}
                      className="text-base font-semibold text-gray-900 hover:text-[#0D9488] line-clamp-2 block"
                    >
                      {r.title}
                    </Link>

                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{r.abstract}</p>

                    <div className="flex items-center flex-wrap gap-4 mt-3 text-xs text-gray-400">
                      <span>
                        By <span className="text-gray-600 font-medium">{r.author_name}</span>
                      </span>
                      {r.published_at && (
                        <span>{new Date(r.published_at).toLocaleDateString()}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {r.views_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="w-3 h-3" /> {r.downloads_count}
                      </span>
                    </div>

                    {r.keywords && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {r.keywords
                          .split(',')
                          .filter(Boolean)
                          .slice(0, 5)
                          .map((kw, i) => (
                            <span
                              key={i}
                              className="inline-flex rounded px-1.5 py-0.5 text-xs bg-gray-100 text-gray-500"
                            >
                              {kw.trim()}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>

                  <Link
                    to={`/research/${r.id}`}
                    className="flex-shrink-0 rounded-xl border border-gray-200 bg-white text-gray-700 hover:border-[#0D9488] hover:text-[#0D9488] px-3 py-2 text-xs font-semibold shadow-sm transition-all duration-200 whitespace-nowrap"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
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
