import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import {
  Users, BookOpen, Calendar, Handshake, FileText, Bell,
  TrendingUp, ArrowRight, Loader2, AlertCircle,
  CheckCircle, MessageSquare,
} from 'lucide-react'
import { adminApi } from '@/api/admin'
import type { AuditLogEntry } from '@/types/admin'
import { USER_ROLE_LABELS } from '@/types/user'

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  colour,
  href,
}: {
  label: string
  value: number | string
  sub?: string
  icon: React.ComponentType<any>
  colour: string
  href?: string
}) {
  const inner = (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition-shadow`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${colour}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  )
  return href ? <Link to={href}>{inner}</Link> : inner
}

// ── Role breakdown bar ────────────────────────────────────────────────────────

function RoleBar({ by_role }: { by_role: Record<string, number> }) {
  const total = Object.values(by_role).reduce((a, b) => a + b, 0)
  if (!total) return null

  const ROLE_COLOURS: Record<string, string> = {
    youth: 'bg-blue-400',
    researcher: 'bg-purple-400',
    mentor: 'bg-green-400',
    research_assistant: 'bg-yellow-400',
    industry_partner: 'bg-orange-400',
    admin: 'bg-red-400',
    staff: 'bg-pink-400',
    program_manager: 'bg-indigo-400',
    content_manager: 'bg-teal-400',
    judge: 'bg-gray-400',
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Members by Role</h3>
      <div className="flex rounded-full overflow-hidden h-3 mb-3">
        {Object.entries(by_role).filter(([, v]) => v > 0).map(([role, count]) => (
          <div
            key={role}
            className={ROLE_COLOURS[role] ?? 'bg-gray-300'}
            style={{ width: `${(count / total) * 100}%` }}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-y-1.5 gap-x-4">
        {Object.entries(by_role).filter(([, v]) => v > 0).map(([role, count]) => (
          <div key={role} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-gray-500">
              <span className={`w-2 h-2 rounded-full ${ROLE_COLOURS[role] ?? 'bg-gray-300'}`} />
              {(USER_ROLE_LABELS as Record<string, string>)[role] ?? role}
            </span>
            <span className="font-medium text-gray-700">{count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Research status donut (text list) ─────────────────────────────────────────

function ResearchStatus({ by_status }: { by_status: Record<string, number> }) {
  const STATUS_COLOURS: Record<string, string> = {
    draft: 'text-gray-400',
    submitted: 'text-blue-500',
    under_review: 'text-yellow-500',
    approved: 'text-green-500',
    rejected: 'text-red-500',
    published: 'text-purple-500',
  }
  const STATUS_LABELS: Record<string, string> = {
    draft: 'Draft', submitted: 'Submitted', under_review: 'Under Review',
    approved: 'Approved', rejected: 'Rejected', published: 'Published',
  }
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Research by Status</h3>
      <div className="space-y-2">
        {Object.entries(by_status).map(([s, count]) => (
          <div key={s} className="flex items-center justify-between text-sm">
            <span className={`font-medium ${STATUS_COLOURS[s] ?? 'text-gray-500'}`}>
              {STATUS_LABELS[s] ?? s}
            </span>
            <span className="text-gray-700 font-semibold">{count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Audit Log feed ────────────────────────────────────────────────────────────

const ACTION_ICONS: Record<string, React.ComponentType<any>> = {
  'user.approved': CheckCircle,
  'user.rejected': AlertCircle,
  'user.suspended': AlertCircle,
  'research.published': BookOpen,
  'announcement.created': Bell,
  'report.exported': FileText,
  'contact.resolved': MessageSquare,
}

function AuditFeed({ entries }: { entries: AuditLogEntry[] }) {
  if (!entries.length) {
    return <p className="text-xs text-gray-400 py-4 text-center">No recent activity.</p>
  }

  return (
    <ul className="space-y-2">
      {entries.map((e) => {
        const Icon = ACTION_ICONS[e.action] ?? TrendingUp
        const label = e.action.replace('.', ' ').replace('_', ' ')
        return (
          <li key={e.id} className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon className="w-3 h-3 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-700 font-medium capitalize">{label}</p>
              {e.target_repr && (
                <p className="text-xs text-gray-400 truncate">{e.target_repr}</p>
              )}
              <p className="text-xs text-gray-300 mt-0.5">
                {e.actor_name ?? 'System'} · {new Date(e.created_at).toLocaleString()}
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { data, isLoading, isError } = useQuery(
    'dashboard-stats',
    () => adminApi.getDashboardStats().then((r) => r.data),
    { refetchInterval: 60_000 },
  )

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-7 h-7 animate-spin text-gray-300" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center text-sm text-gray-500">
        Failed to load dashboard stats.
      </div>
    )
  }

  const pendingUsers = data.users.by_status['pending_approval'] ?? 0
  const activeUsers = data.users.by_status['active'] ?? 0

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Platform overview — YRIF</p>
        </div>
        {pendingUsers > 0 && (
          <Link
            to="/admin/users"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100"
          >
            <AlertCircle className="w-4 h-4" />
            {pendingUsers} pending approval{pendingUsers !== 1 ? 's' : ''}
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Primary stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Members"
          value={data.users.total}
          sub={`+${data.users.new_last_30d} this month`}
          icon={Users}
          colour="bg-blue-500"
          href="/admin/users"
        />
        <StatCard
          label="Active Members"
          value={activeUsers}
          sub={`${pendingUsers} pending`}
          icon={CheckCircle}
          colour="bg-green-500"
          href="/admin/users"
        />
        <StatCard
          label="Research Submissions"
          value={data.research.total}
          sub={`${data.research.by_status['published'] ?? 0} published`}
          icon={BookOpen}
          colour="bg-purple-500"
          href="/admin/research"
        />
        <StatCard
          label="Event Registrations"
          value={data.events.total_registrations}
          sub={`${data.events.upcoming} upcoming events`}
          icon={Calendar}
          colour="bg-orange-500"
          href="/admin/events"
        />
      </div>

      {/* Secondary stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Mentorship Requests"
          value={data.mentorship.total_requests}
          sub={`${data.mentorship.active_matches} active matches`}
          icon={Handshake}
          colour="bg-teal-500"
          href="/admin/mentorship"
        />
        <StatCard
          label="Resources"
          value={data.resources.total}
          sub={`${data.resources.total_downloads.toLocaleString()} downloads`}
          icon={FileText}
          colour="bg-indigo-500"
          href="/admin/content"
        />
        <StatCard
          label="Announcements"
          value={data.content.announcements}
          sub={`${data.content.news_posts} news posts`}
          icon={Bell}
          colour="bg-pink-500"
          href="/admin/content"
        />
        <StatCard
          label="Open Inquiries"
          value={data.content.open_contacts}
          sub="Unresolved contact messages"
          icon={MessageSquare}
          colour="bg-red-400"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RoleBar by_role={data.users.by_role} />
        <ResearchStatus by_status={data.research.by_status} />
      </div>

      {/* Activity + quick links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Recent Activity</h3>
            <Link
              to="/admin/reports"
              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
            >
              View audit log <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <AuditFeed entries={data.recent_activity} />
        </div>

        {/* Quick links */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Quick Actions</h3>
          <nav className="space-y-2">
            {[
              { to: '/admin/users', label: 'Manage Users', icon: Users },
              { to: '/admin/research', label: 'Review Research', icon: BookOpen },
              { to: '/admin/events', label: 'Manage Events', icon: Calendar },
              { to: '/admin/mentorship', label: 'Mentorship', icon: Handshake },
              { to: '/admin/content', label: 'Content & Resources', icon: FileText },
              { to: '/admin/reports', label: 'Reports & Exports', icon: TrendingUp },
            ].map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Icon className="w-4 h-4 text-gray-400" />
                {label}
                <ArrowRight className="w-3 h-3 text-gray-300 ml-auto" />
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  )
}
