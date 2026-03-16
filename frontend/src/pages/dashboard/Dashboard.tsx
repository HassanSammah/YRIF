import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import {
  BookOpen, Send, CalendarDays, Trophy, Users2, Library, Bell,
  ArrowRight, Clock, CheckCircle2, FileText, Award, TrendingUp,
  Handshake, MessageSquare, Megaphone, Sparkles, ShieldCheck,
} from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '@/hooks/useAuth'
import { adminApi } from '@/api/admin'
import { researchApi } from '@/api/research'
import { eventsApi } from '@/api/events'
import { mentorshipApi } from '@/api/mentorship'
import { SkeletonStat, SkeletonCard } from '@/components/common/Skeleton'
import { usePageTitle } from '@/hooks/usePageTitle'

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeGreeting() {
  const h = new Date().getHours()
  if (h < 4) return 'Good evening'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function useGreeting() {
  const [greeting, setGreeting] = useState(computeGreeting)
  useEffect(() => {
    const id = setInterval(() => setGreeting(computeGreeting()), 60_000)
    return () => clearInterval(id)
  }, [])
  return greeting
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
  label, value, sub, icon: Icon, gradient, href,
}: {
  label: string; value: number | string; sub?: string
  icon: React.ComponentType<{ className?: string }>; gradient: string; href?: string
}) {
  const inner = (
    <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4 card-lift overflow-hidden relative">
      {/* Subtle corner accent */}
      <div className={`absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-[0.04] ${gradient}`} />
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${gradient} shadow-sm`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0 relative z-10">
        <p className="text-2xl font-bold text-[#093344] font-display leading-none">{value}</p>
        <p className="text-sm text-gray-500 mt-1">{label}</p>
        {sub && <p className="text-[11px] text-gray-400 mt-1">{sub}</p>}
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
    <Link
      to={to}
      className="group flex items-center gap-3 bg-white rounded-xl border border-gray-100 shadow-sm p-3.5 hover:shadow-md hover:border-gray-200 hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colour} shadow-sm`}>
        <Icon className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#093344] leading-none">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5 truncate">{desc}</p>
      </div>
      <ArrowRight className="w-3 h-3 text-gray-300 group-hover:text-[#0D9488] group-hover:translate-x-0.5 flex-shrink-0 transition-all duration-200" />
    </Link>
  )
}

function SectionHeader({
  icon: Icon, title, iconColor, action,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string; iconColor: string; action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <h2 className="text-sm font-semibold text-[#093344]">{title}</h2>
      </div>
      {action}
    </div>
  )
}

function EmptyState({ icon: Icon, message, action }: {
  icon: React.ComponentType<{ className?: string }>
  message: string; action?: React.ReactNode
}) {
  return (
    <div className="py-10 flex flex-col items-center gap-2.5 text-center">
      <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center">
        <Icon className="w-6 h-6 text-gray-300" />
      </div>
      <p className="text-sm text-gray-400">{message}</p>
      {action}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  usePageTitle('Dashboard')
  const { user, isAdmin, isContentManager } = useAuth()
  const greeting = useGreeting()

  // ── Role flags ───────────────────────────────────────────────────────────
  const isMentor  = user?.role === 'mentor'
  const isRA      = user?.role === 'research_assistant'
  const isPartner = user?.role === 'industry_partner'
  const isJudge   = user?.role === 'judge'

  // ── Data fetches ─────────────────────────────────────────────────────────
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

  // Admin-only: platform stats
  const { data: dashStats, isLoading: loadingDashStats } = useQuery(
    'dash-admin-stats',
    () => adminApi.getDashboardStats().then((r) => r.data),
    { enabled: isAdmin, retry: 1, staleTime: 60_000 },
  )

  // Mentor-only: pending requests + active matches
  const { data: mentorReqs, isLoading: loadingMentorReqs } = useQuery(
    'dash-mentor-reqs',
    () => mentorshipApi.listRequests().then((r) => r.data),
    { enabled: isMentor, retry: 1, staleTime: 30_000 },
  )
  const { data: activeMatches } = useQuery(
    'dash-active-matches',
    () => mentorshipApi.listMatches({ status: 'active' }).then((r) => r.data),
    { enabled: isMentor, retry: 1, staleTime: 60_000 },
  )

  const researchList = myResearch?.results ?? []
  const regsList = myRegs?.results ?? []
  const certsList = Array.isArray(myCertsData) ? myCertsData : []
  const annList = announcements?.results ?? []
  const eventsList = events?.results ?? []
  const publishedCount = researchList.filter((r) => r.status === 'published').length
  const upcomingRegs = regsList.filter((r) => new Date(r.event_start_date) >= new Date()).length
  const pendingMentorReqs = mentorReqs?.results?.filter((r) => r.status === 'pending') ?? []

  const name = user ? (user.first_name || user.email.split('@')[0]) : ''

  // ── Quick actions list ────────────────────────────────────────────────────
  const allQuickActions = [
    { id: 'submit',  show: !isPartner && !isJudge,                          to: '/research/submit',     icon: Send,          label: 'Submit Research',     desc: 'Upload a paper or proposal',     colour: 'bg-gradient-to-br from-purple-500 to-purple-600' },
    { id: 'events',  show: true,                                             to: '/events',              icon: CalendarDays,  label: 'Browse Events',       desc: 'Register for upcoming events',   colour: 'bg-gradient-to-br from-orange-400 to-orange-500' },
    { id: 'comp',    show: true,                                             to: '/competitions',        icon: Trophy,        label: 'Competitions',        desc: 'Enter research competitions',    colour: 'bg-gradient-to-br from-[#df8d31] to-amber-500' },
    { id: 'mentor',  show: !isMentor && !isPartner && !isAdmin && !isJudge, to: '/mentors',             icon: Users2,        label: 'Find a Mentor',       desc: 'Connect with expert mentors',    colour: 'bg-gradient-to-br from-[#0D9488] to-teal-600' },
    { id: 'ra',      show: !isRA && !isPartner && !isAdmin && !isJudge,     to: '/research-assistants', icon: BookOpen,      label: 'Research Assistants', desc: 'Partner on your study',          colour: 'bg-gradient-to-br from-blue-500 to-blue-600' },
    { id: 'hub',     show: true,                                             to: '/resources',           icon: Library,       label: 'Learning Hub',        desc: 'Guides, templates & webinars',   colour: 'bg-gradient-to-br from-sky-500 to-sky-600' },
    { id: 'myment',  show: !isAdmin,                                         to: '/mentorship',          icon: Handshake,     label: 'My Mentorship',       desc: 'View mentorship matches',        colour: 'bg-gradient-to-br from-emerald-500 to-green-600' },
    { id: 'msgs',    show: true,                                             to: '/messages',            icon: MessageSquare, label: 'Messages',            desc: 'Chat with your network',         colour: 'bg-gradient-to-br from-[#093344] to-[#0a3d53]' },
    { id: 'notif',   show: true,                                             to: '/notifications',       icon: Bell,          label: 'Notifications',       desc: 'Stay up to date',                colour: 'bg-gradient-to-br from-pink-500 to-rose-500' },
    // Role-specific additions
    { id: 'rev-res', show: isAdmin,                                          to: '/admin/research',      icon: FileText,      label: 'Review Research',     desc: 'Manage submissions',             colour: 'bg-gradient-to-br from-purple-500 to-purple-600' },
    { id: 'mgmt',    show: isAdmin,                                          to: '/admin/users',         icon: ShieldCheck,   label: 'Manage Users',        desc: 'Approvals & roles',              colour: 'bg-gradient-to-br from-[#093344] to-slate-700' },
    { id: 'cms',     show: isContentManager,                                 to: '/admin/content',       icon: Megaphone,     label: 'Manage Content',      desc: 'News & announcements',           colour: 'bg-gradient-to-br from-[#df8d31] to-amber-500' },
    { id: 'judge-c', show: isJudge,                                          to: '/competitions',        icon: Trophy,        label: 'Judge Competitions',  desc: 'Score & evaluate entries',       colour: 'bg-gradient-to-br from-[#df8d31] to-amber-500' },
  ] as const

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-7 fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#093344]">
            {greeting}, {name}! 👋
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {format(new Date(), "EEEE, MMMM d, yyyy")} · YRIF Platform
          </p>
        </div>
        {isAdmin && (
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#093344] text-white rounded-xl text-sm font-semibold hover:bg-[#0D9488] transition-all duration-200 shadow-sm"
          >
            <TrendingUp className="w-4 h-4" />
            Admin Dashboard
          </Link>
        )}
      </div>

      {/* Stats — role-specific */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {isAdmin ? (
          // ── Admin: platform-wide stats ──────────────────────────────────
          loadingDashStats ? (
            <><SkeletonStat /><SkeletonStat /><SkeletonStat /><SkeletonStat /></>
          ) : (
            <>
              <StatCard
                label="Pending Approvals"
                value={dashStats?.users?.by_status?.pending_approval ?? '–'}
                sub="Awaiting review"
                icon={ShieldCheck}
                gradient="bg-gradient-to-br from-amber-400 to-orange-500"
                href="/admin/users?status=pending_approval"
              />
              <StatCard
                label="Total Members"
                value={dashStats?.users?.total ?? '–'}
                sub={`${dashStats?.users?.new_last_7d ?? 0} new this week`}
                icon={Users2}
                gradient="bg-gradient-to-br from-[#0D9488] to-teal-600"
                href="/admin/users"
              />
              <StatCard
                label="Pending Research"
                value={dashStats?.research?.by_status?.submitted ?? '–'}
                sub="Awaiting review"
                icon={FileText}
                gradient="bg-gradient-to-br from-purple-500 to-purple-600"
                href="/admin/research"
              />
              <StatCard
                label="Upcoming Events"
                value={dashStats?.events?.upcoming ?? '–'}
                sub={`${dashStats?.events?.total ?? 0} total`}
                icon={CalendarDays}
                gradient="bg-gradient-to-br from-blue-500 to-blue-600"
                href="/admin/events"
              />
            </>
          )
        ) : isMentor ? (
          // ── Mentor: mentee + request stats ──────────────────────────────
          <>
            <StatCard
              label="Active Mentees"
              value={activeMatches?.count ?? 0}
              sub="Current matches"
              icon={Users2}
              gradient="bg-gradient-to-br from-[#0D9488] to-teal-600"
              href="/mentorship"
            />
            <StatCard
              label="Pending Requests"
              value={pendingMentorReqs.length}
              sub="Awaiting response"
              icon={Handshake}
              gradient="bg-gradient-to-br from-amber-400 to-orange-500"
              href="/mentorship"
            />
            {loadingRegs ? (
              <><SkeletonStat /><SkeletonStat /></>
            ) : (
              <>
                <StatCard
                  label="Events Joined"
                  value={regsList.length}
                  sub={`${upcomingRegs} upcoming`}
                  icon={CalendarDays}
                  gradient="bg-gradient-to-br from-orange-400 to-orange-500"
                  href="/events"
                />
                <StatCard
                  label="Certificates"
                  value={certsList.length}
                  sub="Earned"
                  icon={Award}
                  gradient="bg-gradient-to-br from-[#df8d31] to-amber-500"
                  href="/certificates"
                />
              </>
            )}
          </>
        ) : isPartner ? (
          // ── Industry Partner: events + certs (no research stats) ─────────
          loadingRegs ? (
            <><SkeletonStat /><SkeletonStat /><SkeletonStat /><SkeletonStat /></>
          ) : (
            <>
              <StatCard
                label="Events Joined"
                value={regsList.length}
                sub={`${upcomingRegs} upcoming`}
                icon={CalendarDays}
                gradient="bg-gradient-to-br from-orange-400 to-orange-500"
                href="/events"
              />
              <StatCard
                label="Certificates"
                value={certsList.length}
                sub="Earned"
                icon={Award}
                gradient="bg-gradient-to-br from-[#df8d31] to-amber-500"
                href="/certificates"
              />
              <StatCard
                label="Partner Network"
                value="—"
                sub="View mentors & partners"
                icon={Handshake}
                gradient="bg-gradient-to-br from-[#0D9488] to-teal-600"
                href="/mentors"
              />
              <StatCard
                label="Research Repo"
                value="—"
                sub="Browse publications"
                icon={BookOpen}
                gradient="bg-gradient-to-br from-blue-500 to-blue-600"
                href="/research"
              />
            </>
          )
        ) : (
          // ── Default: youth, researcher, RA, content_manager, judge ────────
          <>
            {loadingResearch ? (
              <><SkeletonStat /><SkeletonStat /></>
            ) : (
              <>
                <StatCard
                  label="My Research"
                  value={researchList.length}
                  sub={`${publishedCount} published`}
                  icon={BookOpen}
                  gradient="bg-gradient-to-br from-purple-500 to-purple-600"
                  href="/research/my"
                />
                <StatCard
                  label="Published"
                  value={publishedCount}
                  sub="In repository"
                  icon={CheckCircle2}
                  gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
                  href="/research"
                />
              </>
            )}
            {loadingRegs ? (
              <><SkeletonStat /><SkeletonStat /></>
            ) : (
              <>
                <StatCard
                  label="Events Joined"
                  value={regsList.length}
                  sub={`${upcomingRegs} upcoming`}
                  icon={CalendarDays}
                  gradient="bg-gradient-to-br from-orange-400 to-orange-500"
                  href="/events"
                />
                <StatCard
                  label="Certificates"
                  value={certsList.length}
                  sub="Earned"
                  icon={Award}
                  gradient="bg-gradient-to-br from-[#df8d31] to-amber-500"
                  href="/certificates"
                />
              </>
            )}
          </>
        )}
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">

          {/* Admin: Pending Approvals callout */}
          {isAdmin && (
            <section className="bg-amber-50 rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
              <SectionHeader
                icon={ShieldCheck}
                title="Pending Approvals"
                iconColor="text-amber-600"
                action={
                  <Link to="/admin/users?status=pending_approval" className="text-xs text-amber-700 hover:text-amber-900 flex items-center gap-1 font-medium transition-colors">
                    Review all <ArrowRight className="w-3 h-3" />
                  </Link>
                }
              />
              <div className="px-5 py-4">
                {loadingDashStats ? (
                  <SkeletonCard rows={1} />
                ) : (
                  <p className="text-sm text-gray-600">
                    <span className="text-2xl font-bold text-amber-600 mr-1.5">
                      {dashStats?.users?.by_status?.pending_approval ?? 0}
                    </span>
                    {(dashStats?.users?.by_status?.pending_approval ?? 0) === 1 ? 'user' : 'users'} awaiting approval
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Mentor: Pending mentorship requests */}
          {isMentor && (
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <SectionHeader
                icon={Handshake}
                title="Mentorship Requests"
                iconColor="text-[#0D9488]"
                action={
                  <Link to="/mentorship" className="text-xs text-[#0D9488] hover:text-[#093344] flex items-center gap-1 font-medium transition-colors">
                    View all <ArrowRight className="w-3 h-3" />
                  </Link>
                }
              />
              <div className="divide-y divide-gray-50">
                {loadingMentorReqs ? (
                  <div className="p-5"><SkeletonCard rows={2} /></div>
                ) : pendingMentorReqs.length === 0 ? (
                  <EmptyState icon={Handshake} message="No pending mentorship requests." />
                ) : (
                  pendingMentorReqs.slice(0, 3).map((req) => (
                    <div key={req.id} className="px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
                      <p className="text-sm font-medium text-[#093344]">{req.topic}</p>
                      {req.message && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 leading-relaxed">{req.message}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          {/* Announcements */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <SectionHeader
              icon={Megaphone}
              title="Announcements"
              iconColor="text-[#df8d31]"
            />
            <div className="divide-y divide-gray-50">
              {loadingAnn ? (
                <div className="p-5"><SkeletonCard rows={2} /></div>
              ) : annList.length === 0 ? (
                <EmptyState icon={Megaphone} message="No announcements right now." />
              ) : (
                annList.slice(0, 4).map((ann) => (
                  <div key={ann.id} className="px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
                    <p className="text-sm font-medium text-[#093344]">{ann.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{ann.content}</p>
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
            <SectionHeader
              icon={CalendarDays}
              title="Upcoming Events"
              iconColor="text-[#0D9488]"
              action={
                <Link to="/events" className="text-xs text-[#0D9488] hover:text-[#093344] flex items-center gap-1 font-medium transition-colors">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              }
            />
            <div className="divide-y divide-gray-50">
              {loadingEvents ? (
                <div className="p-5"><SkeletonCard rows={2} /></div>
              ) : eventsList.length === 0 ? (
                <EmptyState
                  icon={CalendarDays}
                  message="No upcoming events."
                  action={
                    <Link to="/events" className="text-xs font-medium text-[#0D9488] hover:underline">
                      Browse all events
                    </Link>
                  }
                />
              ) : (
                eventsList.slice(0, 5).map((ev) => (
                  <Link
                    key={ev.id}
                    to={`/events/${ev.id}`}
                    className="flex items-start gap-3.5 px-5 py-3.5 hover:bg-gray-50/60 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#093344]/5 border border-[#093344]/8 flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-[9px] font-bold text-[#0D9488] uppercase leading-tight tracking-wide">
                        {format(new Date(ev.start_date), 'MMM')}
                      </span>
                      <span className="text-sm font-bold text-[#093344] leading-none">
                        {format(new Date(ev.start_date), 'd')}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#093344] truncate">{ev.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {ev.is_online ? 'Online' : ev.location} · <span className="capitalize">{ev.event_type}</span>
                      </p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#0D9488] group-hover:translate-x-0.5 flex-shrink-0 mt-1 transition-all duration-200" />
                  </Link>
                ))
              )}
            </div>
          </section>

          {/* My research (if any) — hidden for partners and judges */}
          {!loadingResearch && researchList.length > 0 && !isPartner && !isJudge && (
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <SectionHeader
                icon={BookOpen}
                title="My Research"
                iconColor="text-purple-500"
                action={
                  <Link to="/research/my" className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1 font-medium transition-colors">
                    View all <ArrowRight className="w-3 h-3" />
                  </Link>
                }
              />
              <div className="divide-y divide-gray-50">
                {researchList.slice(0, 3).map((r) => (
                  <Link
                    key={r.id}
                    to={`/research/${r.id}`}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/60 transition-colors group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-3.5 h-3.5 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#093344] truncate">{r.title}</p>
                      <p className="text-xs text-gray-400 capitalize">{r.category.replace('_', ' ')}</p>
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
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 px-1 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#df8d31]" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Quick Actions</h2>
          </div>
          {allQuickActions
            .filter((a) => a.show)
            .map(({ id, show: _show, ...props }) => (
              <QuickAction key={id} {...props} />
            ))}
        </div>
      </div>
    </div>
  )
}
