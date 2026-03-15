import { useState } from 'react'
import { useQuery } from 'react-query'
import {
  Search, Download, ExternalLink, BookOpen, FileText, Database,
  Video, Play, ChevronLeft, ChevronRight, Loader2, Calendar,
  Eye, Tag,
} from 'lucide-react'
import { SkeletonCard } from '@/components/common/Skeleton'
import { resourcesApi } from '@/api/resources'
import type { Resource, Webinar, ResourceType } from '@/types/resources'
import { RESOURCE_TYPE_LABELS } from '@/types/resources'

// ── Type icons & colours ──────────────────────────────────────────────────────

const TYPE_META: Record<ResourceType, { icon: React.ComponentType<any>; colour: string; bg: string }> = {
  guide:     { icon: BookOpen, colour: 'text-[#0D9488]',   bg: 'bg-teal-50' },
  template:  { icon: FileText, colour: 'text-purple-600', bg: 'bg-purple-50' },
  dataset:   { icon: Database, colour: 'text-green-600',  bg: 'bg-green-50' },
  webinar:   { icon: Video,    colour: 'text-orange-600', bg: 'bg-orange-50' },
  recording: { icon: Play,     colour: 'text-red-600',    bg: 'bg-red-50' },
  other:     { icon: FileText, colour: 'text-gray-600',   bg: 'bg-gray-100' },
}

const TYPE_FILTERS: Array<{ value: string; label: string }> = [
  { value: '', label: 'All' },
  ...Object.entries(RESOURCE_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l })),
]

// ── Resource Card ─────────────────────────────────────────────────────────────

function ResourceCard({ resource }: { resource: Resource }) {
  const [downloading, setDownloading] = useState(false)
  const meta = TYPE_META[resource.resource_type]
  const Icon = meta.icon
  const hasAction = resource.file_url || resource.external_url

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const { data } = await resourcesApi.downloadResource(resource.id)
      window.open(data.url, '_blank', 'noopener,noreferrer')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 card-lift">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
          <Icon className={`w-5 h-5 ${meta.colour}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
            {resource.title}
          </p>
          <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${meta.bg} ${meta.colour}`}>
            {RESOURCE_TYPE_LABELS[resource.resource_type]}
          </span>
        </div>
      </div>

      {/* Description */}
      {resource.description && (
        <p className="text-xs text-gray-500 line-clamp-2">{resource.description}</p>
      )}

      {/* Tags */}
      {resource.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {resource.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
            >
              <Tag className="w-2.5 h-2.5" />{tag}
            </span>
          ))}
        </div>
      )}

      {/* Stats + action */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />{resource.views_count}
          </span>
          <span className="flex items-center gap-1">
            <Download className="w-3.5 h-3.5" />{resource.downloads_count}
          </span>
        </div>
        {hasAction && (
          <button
            onClick={handleDownload}
            disabled={downloading}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${meta.bg} ${meta.colour} hover:opacity-80`}
          >
            {downloading
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : resource.external_url && !resource.file_url
              ? <ExternalLink className="w-3.5 h-3.5" />
              : <Download className="w-3.5 h-3.5" />
            }
            {resource.external_url && !resource.file_url ? 'Open' : 'Download'}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Webinar Card ──────────────────────────────────────────────────────────────

function WebinarCard({ webinar }: { webinar: Webinar }) {
  const isPast = webinar.is_past
  const hasRecording = !!webinar.recording_url
  const hasRegistration = !!webinar.registration_link && !isPast

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 card-lift">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isPast ? 'bg-gray-100' : 'bg-orange-50'}`}>
          {isPast
            ? <Play className="w-5 h-5 text-gray-500" />
            : <Video className="w-5 h-5 text-orange-600" />
          }
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900 line-clamp-2">{webinar.title}</p>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
            <Calendar className="w-3 h-3" />
            {new Date(webinar.scheduled_at).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
            <span className={`ml-1.5 rounded-full px-2 py-0.5 font-medium ${isPast ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'}`}>
              {isPast ? 'Past' : 'Upcoming'}
            </span>
          </div>
        </div>
      </div>

      {webinar.description && (
        <p className="text-xs text-gray-500 line-clamp-2">{webinar.description}</p>
      )}

      {webinar.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {webinar.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 pt-2 border-t border-gray-50 mt-auto">
        <span className="flex items-center gap-1 text-xs text-gray-400 mr-auto">
          <Eye className="w-3.5 h-3.5" />{webinar.views_count}
        </span>
        {hasRecording && (
          <a
            href={webinar.recording_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:opacity-80"
          >
            <Play className="w-3.5 h-3.5" /> Watch Recording
          </a>
        )}
        {hasRegistration && (
          <a
            href={webinar.registration_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-600 hover:opacity-80"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Register
          </a>
        )}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ResourceHub() {
  const [tab, setTab] = useState<'resources' | 'webinars'>('resources')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [page, setPage] = useState(1)
  const [webinarFilter, setWebinarFilter] = useState<'' | 'upcoming' | 'past'>('')

  const { data: resourceData, isLoading: loadingResources } = useQuery(
    ['resources', search, typeFilter, tagFilter, page],
    () =>
      resourcesApi
        .listResources({
          search: search || undefined,
          resource_type: (typeFilter as ResourceType) || undefined,
          tag: tagFilter || undefined,
          page,
        })
        .then((r) => r.data),
    { keepPreviousData: true, enabled: tab === 'resources' },
  )

  const { data: webinarData, isLoading: loadingWebinars } = useQuery(
    ['webinars', webinarFilter, search],
    () =>
      resourcesApi
        .listWebinars({
          when: webinarFilter || undefined,
          search: search || undefined,
        })
        .then((r) => r.data),
    { keepPreviousData: true, enabled: tab === 'webinars' },
  )

  // Collect all unique tags from loaded resources for quick-filter chips
  const allTags = Array.from(
    new Set((resourceData?.results ?? []).flatMap((r) => r.tags))
  ).slice(0, 12)

  const totalPages = tab === 'resources'
    ? Math.ceil((resourceData?.count ?? 0) / 20)
    : Math.ceil((webinarData?.count ?? 0) / 20)

  const isLoading = tab === 'resources' ? loadingResources : loadingWebinars
  const count = tab === 'resources' ? resourceData?.count : webinarData?.count

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#093344]">Learning & Resources Hub</h1>
        <p className="text-sm text-gray-500 mt-1">
          Guides, templates, datasets, recorded sessions, and upcoming webinars for young researchers.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-6">
        {(['resources', 'webinars'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setPage(1); setSearch(''); setTagFilter('') }}
            className={`rounded-lg px-5 py-1.5 text-sm font-medium transition-colors capitalize ${
              tab === t ? 'bg-white shadow-sm text-[#093344]' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'resources' ? 'Resources' : 'Webinars & Sessions'}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder={tab === 'resources' ? 'Search resources…' : 'Search webinars…'}
          className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] hover:border-gray-300"
        />
      </div>

      {/* Resource type filter pills */}
      {tab === 'resources' && (
        <div className="flex flex-wrap gap-2 mb-4">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setTypeFilter(f.value); setPage(1) }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                typeFilter === f.value
                  ? 'bg-[#093344] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Webinar filter */}
      {tab === 'webinars' && (
        <div className="flex gap-2 mb-4">
          {([['', 'All'], ['upcoming', 'Upcoming'], ['past', 'Past & Recordings']] as const).map(([v, l]) => (
            <button
              key={v}
              onClick={() => setWebinarFilter(v)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                webinarFilter === v
                  ? 'bg-[#093344] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      )}

      {/* Tag chips */}
      {tab === 'resources' && allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          <span className="text-xs text-gray-400 self-center">Tags:</span>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setTagFilter(tagFilter === tag ? '' : tag)}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs transition-colors ${
                tagFilter === tag
                  ? 'bg-teal-100 text-[#0D9488] font-medium'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              <Tag className="w-2.5 h-2.5" />{tag}
            </button>
          ))}
        </div>
      )}

      {/* Count */}
      {count !== undefined && (
        <p className="text-xs text-gray-400 mb-4">
          {count} {tab === 'resources' ? 'resource' : 'session'}{count !== 1 ? 's' : ''} found
        </p>
      )}

      {/* Content grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} rows={3} />)}
        </div>
      ) : tab === 'resources' && !resourceData?.results.length ? (
        <div className="py-20 text-center text-sm text-gray-400">
          No resources found{search || typeFilter || tagFilter ? ' for your filters' : ''}. Check back soon!
        </div>
      ) : tab === 'webinars' && !webinarData?.results.length ? (
        <div className="py-20 text-center text-sm text-gray-400">
          No webinars found. Check back soon!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tab === 'resources' &&
            resourceData?.results.map((r) => <ResourceCard key={r.id} resource={r} />)}
          {tab === 'webinars' &&
            webinarData?.results.map((w) => <WebinarCard key={w.id} webinar={w} />)}
        </div>
      )}

      {/* Pagination */}
      {count !== undefined && count > 20 && (
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
    </div>
  )
}
