import { Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import { Megaphone, Newspaper, Clock, ArrowRight } from 'lucide-react'
import { publicApi } from '@/api/public'
import { SkeletonCard } from '@/components/common/Skeleton'
import type { Announcement, NewsPost } from '@/types/admin'

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function AnnouncementCard({ item }: { item: Announcement }) {
  return (
    <div className="flex gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:shadow-sm transition-shadow">
      <div className="w-9 h-9 rounded-lg bg-brand-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Megaphone size={16} className="text-brand-gold" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-brand-navy line-clamp-1">{item.title}</p>
        <p className="text-xs text-content-secondary line-clamp-2 mt-0.5 leading-relaxed">{item.content}</p>
        <div className="flex items-center gap-1 mt-1.5 text-xs text-content-secondary">
          <Clock size={11} />
          <span>{timeAgo(item.published_at ?? item.created_at)}</span>
        </div>
      </div>
    </div>
  )
}

function NewsCard({ item }: { item: NewsPost }) {
  return (
    <Link
      to="/dashboard"
      className="group block glass-card bg-white rounded-2xl p-5 hover:-translate-y-1 transition-transform"
    >
      {item.cover_image && (
        <div className="aspect-video rounded-lg overflow-hidden mb-4 bg-gray-100">
          <img
            src={item.cover_image}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="flex items-center gap-2 mb-2">
        <Newspaper size={13} className="text-brand-teal" />
        <span className="text-xs text-brand-teal font-medium">News</span>
        <span className="text-xs text-content-secondary ml-auto flex items-center gap-1">
          <Clock size={11} />{timeAgo(item.published_at ?? item.created_at)}
        </span>
      </div>
      <h3 className="text-sm font-semibold text-brand-navy group-hover:text-brand-teal transition-colors line-clamp-2 leading-snug">
        {item.title}
      </h3>
      {item.body && (
        <p className="text-xs text-content-secondary mt-1.5 line-clamp-2 leading-relaxed">
          {item.body.replace(/<[^>]+>/g, '')}
        </p>
      )}
    </Link>
  )
}

export default function NewsAnnouncements() {
  const { data: annData, isLoading: annLoading } = useQuery(
    'landing:announcements',
    () => publicApi.getAnnouncements().then((r) => r.data.results ?? r.data),
    { staleTime: 5 * 60_000, retry: false }
  )
  const { data: newsData, isLoading: newsLoading } = useQuery(
    'landing:news',
    () => publicApi.getNews(3).then((r) => r.data.results ?? r.data),
    { staleTime: 5 * 60_000, retry: false }
  )

  const announcements: Announcement[] = Array.isArray(annData) ? annData : (annData as unknown as { results?: Announcement[] })?.results ?? []
  const newsPosts: NewsPost[] = Array.isArray(newsData) ? newsData : (newsData as unknown as { results?: NewsPost[] })?.results ?? []

  if (!annLoading && !newsLoading && announcements.length === 0 && newsPosts.length === 0) {
    return null
  }

  return (
    <section id="news" className="py-20 bg-gradient-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <div className="inline-block text-xs font-semibold text-brand-navy bg-brand-navy/5 px-3 py-1.5 rounded-full border border-brand-navy/10 mb-3">
              Latest Updates
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-navy">
              News & Announcements
            </h2>
            <p className="mt-2 text-content-secondary">Stay informed on YRIF activities and opportunities.</p>
          </div>
          <Link
            to="/dashboard"
            className="flex-shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-teal hover:underline"
          >
            All updates <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Announcements column */}
          {(annLoading || announcements.length > 0) && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-content-secondary mb-4">
                Announcements
              </h3>
              {annLoading
                ? [0, 1, 2].map((i) => <SkeletonCard key={i} rows={2} />)
                : announcements.slice(0, 4).map((a) => <AnnouncementCard key={a.id} item={a} />)
              }
            </div>
          )}

          {/* News cards */}
          <div className={`${announcements.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'} grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${announcements.length > 0 ? '2' : '3'} gap-6`}>
            {newsLoading
              ? [0, 1].map((i) => <SkeletonCard key={i} rows={3} />)
              : newsPosts.map((n) => <NewsCard key={n.id} item={n} />)
            }
          </div>
        </div>
      </div>
    </section>
  )
}
