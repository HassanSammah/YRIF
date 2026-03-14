import { Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import {
  BookOpen, Send, CalendarDays, Trophy, Users2, Library, Bell,
  ArrowRight, Clock, CheckCircle2, FileText, Award, TrendingUp,
  Handshake, MessageSquare, Megaphone,
} from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '@/hooks/useAuth'
import { adminApi } from '@/api/admin'
import { researchApi } from '@/api/research'
import { eventsApi } from '@/api/events'
import { SkeletonStat, SkeletonCard } from '@/components/common/Skeleton'

// ── Helpers ───────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  submitted: 'bg-blue-50 text-blue-700',
  under_review: 'bg-amber-50 text-amber-700',
  approved: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
  published: 'bg-purple-50 text-purple-700',
}
const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft', submitted: 'Submitted', under_review: 'Under Review',
  approved: 'Approved', rejected: 'Rejected', published: 'Published',
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon: Icon, colour, href,
}: {
  label: string; value: number | string; sub?: string
  icon: React.ComponentType<{ className?: string }>; colour: string; href?: string
}) {
  const inner = (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${colour}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-content-primary">{value}</p>
        <p className="text-sm text-content-secondary mt-0.5">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  )
  return href ? <Link to={href} className="block">{inner}</Link> : inner
}

function QuickAction({ to, icon: Icon, label, desc, colour }: {
  to: string; icon: React.ComponentType<{ className?: string }>
  label: string; desc: string; colour: string
}) {
  return (
    <Link to={to} className="group flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:-translate-y-0.5 transition-all">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${colour}`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-content-primary">{label}</p>
        <p className="text-xs text-content-secondary truncate">{desc}</p>
      </div>
      <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 flex-shrink-0 transition-colors" />
    </Link>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user, isAdmin } = useAuth()

  const { data: myResearch, isLoading: loadingResearch } = useQuery(
    'dash-research',
    () => researchApi.myResearch().then((r) => r.data),
    { retry: 1, staleTime: 60_000 },
  )
  const { data: myRegs, isLoading: loadingRegs } = useQuery(
    'dash-regs',
    () => eventsApi.myRegistrations().then((r) => r.data),
    { retry: 1, staleTime: 60_000 },
  )
  const { data: myCertsData } = useQuery(
    'dash-certs',
    () => eventsApi.myCertificates().then((r) => r.data),
    { retry: 1, staleTime: 60_000 },
  )
  const { data: announcements, isLoading: loadingAnn } = useQuery(
    'dash-ann',
    () => adminApi.listPublicAnnouncements().then((r) => r.data),
    { retry: 1, staleTime: 120_000 },
  )
  const { data: events, isLoading: loadingEvents } = useQuery(
    'dash-events',
    () => eventsApi.list({ page: 1 }).then((r) => r.data),
    { retry: 1, staleTime: 120_000 },
  )

  const researchList = myResearch?.results ?? []
  const regsList = myRegs?.results ?? []
  const certsList = Array.isArray(myCertsData) ? myCertsData : []
  const annList = announcements?.results ?? []
  const eventsList = events?.results ?? []
  const publishedCount = researchList.filter((r) => r.status === 'published').length
  const upcomingRegs = regsList.filter((r) => new Date(r.event_start_date) >= new Date()).length

  const name = user ? (user.first_name || user.email.split('@')[0]) : ''

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#093344] font-display">
            {getGreeting()}, {name}! 👋
          </h1>
          <p className="text-sm text-content-secondary mt-1">
            {format(new Date(), "EEEE, MMMM d, yyyy")} — Welcome to your YRIF portal.
          </p>
        </div>
        {isAdmin && (
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#093344] text-white rounded-xl text-sm font-medium hover:bg-[#0a3d53] transition-colors shadow-sm"
          >
            <TrendingUp className="w-4 h-4" />
            Admin Dashboard
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loadingResearch ? (
          <><SkeletonStat /><SkeletonStat /></>
        ) : (
          <>
            <StatCard label="My Research" value={researchList.length} sub={`${publishedCount} published`} icon={BookOpen} colour="bg-purple-500" href="/research/my" />
            <StatCard label="Published" value={publishedCount} sub="In repository" icon={CheckCircle2} colour="bg-green-500" href="/research" />
          </>
        )}
        {loadingRegs ? (
          <><SkeletonStat /><SkeletonStat /></>
        ) : (
          <>
            <StatCard label="Events Joined" value={regsList.length} sub={`${upcomingRegs} upcoming`} icon={CalendarDays} colour="bg-orange-500" href="/events" />
            <StatCard label="Certificates" value={certsList.length} sub="Earned" icon={Award} colour="bg-[#df8d31]" href="/certificates" />
          </>
        )}
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Announcements */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-50">
              <Megaphone className="w-4 h-4 text-[#df8d31]" />
              <h2 className="text-sm font-semibold text-content-primary">Announcements</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {loadingAnn ? (
                <div className="p-5"><SkeletonCard rows={2} /></div>
              ) : annList.length === 0 ? (
                <p className="py-10 text-sm text-gray-400 text-center">No announcements.</p>
              ) : (
                annList.slice(0, 4).map((ann) => (
                  <div key={ann.id} className="px-5 py-3.5">
                    <p className="text-sm font-medium text-content-primary">{ann.title}</p>
                    <p className="text-xs text-content-secondary mt-0.5 line-clamp-2">{ann.content}</p>
                    {ann.published_at && (
                      <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(ann.published_at), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Upcoming events */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-[#0D9488]" />
                <h2 className="text-sm font-semibold text-content-primary">Upcoming Events</h2>
              </div>
              <Link to="/events" className="text-xs text-[#0D9488] hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {loadingEvents ? (
                <div className="p-5"><SkeletonCard rows={2} /></div>
              ) : eventsList.length === 0 ? (
                <p className="py-10 text-sm text-gray-400 text-center">No upcoming events.</p>
              ) : (
                eventsList.map((ev) => (
                  <Link key={ev.id} to={`/events/${ev.id}`} className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors group">
                    <div className="w-10 h-10 rounded-xl bg-[#093344]/5 flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-[9px] font-bold text-[#093344] uppercase leading-tight">
                        {format(new Date(ev.start_date), 'MMM')}
                      </span>
                      <span className="text-sm font-bold text-[#093344] leading-none">
                        {format(new Date(ev.start_date), 'd')}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-content-primary truncate">{ev.title}</p>
                      <p className="text-xs text-content-secondary mt-0.5">
                        {ev.is_online ? 'Online' : ev.location} · <span className="capitalize">{ev.event_type}</span>
                      </p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 flex-shrink-0 mt-1" />
                  </Link>
                ))
              )}
            </div>
          </section>

          {/* My research (if any) */}
          {!loadingResearch && researchList.length > 0 && (
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-500" />
                  <h2 className="text-sm font-semibold text-content-primary">My Research</h2>
                </div>
                <Link to="/research/my" className="text-xs text-purple-600 hover:underline flex items-center gap-1">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="divide-y divide-gray-50">
                {researchList.slice(0, 3).map((r) => (
                  <Link key={r.id} to={`/research/${r.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <FileText className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-content-primary truncate">{r.title}</p>
                      <p className="text-xs text-content-secondary capitalize">{r.category.replace('_', ' ')}</p>
                    </div>
                    <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full flex-shrink-0 ${STATUS_STYLE[r.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABEL[r.status] ?? r.status}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right column — quick actions */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-content-secondary px-1">Quick Actions</h2>
          <QuickAction to="/research/submit" icon={Send} label="Submit Research" desc="Upload a paper or proposal" colour="bg-purple-500" />
          <QuickAction to="/events" icon={CalendarDays} label="Browse Events" desc="Register for events" colour="bg-orange-500" />
          <QuickAction to="/competitions" icon={Trophy} label="Competitions" desc="Enter research competitions" colour="bg-[#df8d31]" />
          <QuickAction to="/mentors" icon={Users2} label="Find a Mentor" desc="Connect with experts" colour="bg-[#0D9488]" />
          <QuickAction to="/resources" icon={Library} label="Learning Hub" desc="Guides, templates & webinars" colour="bg-blue-500" />
          <QuickAction to="/mentorship" icon={Handshake} label="My Mentorship" desc="View mentorship matches" colour="bg-green-600" />
          <QuickAction to="/messages" icon={MessageSquare} label="Messages" desc="Chat with your network" colour="bg-[#093344]" />
          <QuickAction to="/notifications" icon={Bell} label="Notifications" desc="Stay informed" colour="bg-pink-500" />
        </div>
      </div>
    </div>
  )
}
