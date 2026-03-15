import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Link } from 'react-router-dom'
import {
  Plus, Search, Filter, Loader2, ChevronLeft, ChevronRight,
  Eye, Edit2, Trash2, Globe, GlobeLock, Trophy, Users,
} from 'lucide-react'
import { eventsApi } from '@/api/events'
import { EVENT_TYPE_LABELS } from '@/types/events'
import type { Event, EventType, EventRegistration } from '@/types/events'
import { usePageTitle } from '@/hooks/usePageTitle'

// ── Create/Edit event modal ───────────────────────────────────────────────────

function EventFormModal({
  event,
  onClose,
  onSaved,
}: {
  event?: Event
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!event
  const [form, setForm] = useState({
    title: event?.title ?? '',
    description: event?.description ?? '',
    event_type: event?.event_type ?? 'seminar',
    start_date: event?.start_date?.slice(0, 16) ?? '',
    end_date: event?.end_date?.slice(0, 16) ?? '',
    registration_deadline: event?.registration_deadline?.slice(0, 16) ?? '',
    location: event?.location ?? '',
    is_online: event?.is_online ?? false,
    online_link: event?.online_link ?? '',
    max_participants: event?.max_participants?.toString() ?? '',
  })
  const [error, setError] = useState('')

  const saveMutation = useMutation(
    () => {
      const payload = {
        ...form,
        max_participants: form.max_participants ? parseInt(form.max_participants) : null,
        registration_deadline: form.registration_deadline || null,
      }
      return isEdit
        ? eventsApi.update(event!.id, payload)
        : eventsApi.create(payload)
    },
    {
      onSuccess: () => { onSaved(); onClose() },
      onError: () => setError('Failed to save event. Check all required fields.'),
    },
  )

  const field = (key: keyof typeof form) => ({
    value: form[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  })

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-[#093344]">
            {isEdit ? 'Edit Event' : 'Create Event'}
          </h2>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
            <input
              {...field('title')}
              required
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] hover:border-gray-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
            <textarea
              {...field('description')}
              required
              rows={3}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] hover:border-gray-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Type *</label>
              <div className="relative">
                <select
                  {...field('event_type')}
                  className="w-full appearance-none pr-10 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] hover:border-gray-300"
                >
                  {(Object.entries(EVENT_TYPE_LABELS) as [EventType, string][]).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Participants</label>
              <input
                type="number"
                min="1"
                {...field('max_participants')}
                placeholder="Unlimited"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] hover:border-gray-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date *</label>
              <input type="datetime-local" {...field('start_date')} required
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] hover:border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date *</label>
              <input type="datetime-local" {...field('end_date')} required
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] hover:border-gray-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Registration Deadline</label>
            <input type="datetime-local" {...field('registration_deadline')}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] hover:border-gray-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
            <input {...field('location')} placeholder="Venue or city"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] hover:border-gray-300"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is-online"
              checked={form.is_online}
              onChange={(e) => setForm((f) => ({ ...f, is_online: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <label htmlFor="is-online" className="text-sm text-gray-700">Online event</label>
          </div>

          {form.is_online && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Online Link</label>
              <input type="url" {...field('online_link')} placeholder="https://..."
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] hover:border-gray-300"
              />
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isLoading}
              className="flex-1 rounded-xl bg-[#093344] hover:bg-[#0D9488] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/50 focus:ring-offset-2"
            >
              {saveMutation.isLoading
                ? <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                : isEdit ? 'Save Changes' : 'Create Event'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 bg-white text-gray-700 hover:border-[#0D9488] hover:text-[#0D9488] px-4 py-2.5 text-sm font-semibold shadow-sm transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Publish winners modal ─────────────────────────────────────────────────────

function PublishWinnersModal({
  event,
  onClose,
  onPublished,
}: {
  event: Event
  onClose: () => void
  onPublished: () => void
}) {
  const [winners, setWinners] = useState<{ registration_id: string; rank: string }[]>([
    { registration_id: '', rank: '1st Place' },
  ])
  const [error, setError] = useState('')

  const { data: regs, isLoading: regsLoading } = useQuery(
    ['event-regs', event.id],
    () => eventsApi.getRegistrations(event.id).then((r) => r.data),
  )

  const publishMutation = useMutation(
    () => eventsApi.publishWinners(event.id, winners.filter((w) => w.registration_id)),
    {
      onSuccess: () => { onPublished(); onClose() },
      onError: () => setError('Failed to publish winners.'),
    },
  )

  const updateWinner = (i: number, key: 'registration_id' | 'rank', val: string) => {
    setWinners((prev) => prev.map((w, idx) => idx === i ? { ...w, [key]: val } : w))
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-[#093344] flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" /> Publish Winners
          </h2>
          <p className="text-sm text-gray-500 mt-0.5 line-clamp-1 italic">{event.title}</p>
        </div>

        <div className="px-6 py-5">
          <div className="space-y-3 mb-4">
            {winners.map((w, i) => (
              <div key={i} className="flex gap-2">
                <div className="relative flex-1">
                  <select
                    value={w.registration_id}
                    onChange={(e) => updateWinner(i, 'registration_id', e.target.value)}
                    aria-label={`Winner ${i + 1} participant`}
                    disabled={regsLoading}
                    className="w-full appearance-none pr-10 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] hover:border-gray-300"
                  >
                    <option value="">Select participant…</option>
                    {(regs?.results as EventRegistration[] ?? [])
                      .filter((r) => r.status !== 'cancelled')
                      .map((r) => (
                        <option key={r.id} value={r.id}>{r.participant_name}</option>
                      ))}
                  </select>
                  <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <input
                  value={w.rank}
                  onChange={(e) => updateWinner(i, 'rank', e.target.value)}
                  placeholder="Rank"
                  className="w-32 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] hover:border-gray-300"
                />
                {winners.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setWinners((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-red-400 hover:text-red-600 text-xs px-1"
                    aria-label="Remove winner"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setWinners((prev) => [...prev, { registration_id: '', rank: '' }])}
            className="text-xs text-[#0D9488] hover:underline mb-4 block"
          >
            + Add another winner
          </button>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-3">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isLoading}
              className="flex-1 rounded-xl bg-[#093344] hover:bg-[#0D9488] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/50 focus:ring-offset-2"
            >
              {publishMutation.isLoading
                ? <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                : 'Publish Winners'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 bg-white text-gray-700 hover:border-[#0D9488] hover:text-[#0D9488] px-4 py-2.5 text-sm font-semibold shadow-sm transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Event row ─────────────────────────────────────────────────────────────────

function EventRow({ event, onRefresh }: { event: Event; onRefresh: () => void }) {
  const [editing, setEditing] = useState(false)
  const [publishingWinners, setPublishingWinners] = useState(false)

  const publishMutation = useMutation(
    (pub: boolean) => eventsApi.publish(event.id, pub),
    { onSuccess: onRefresh },
  )

  const deleteMutation = useMutation(
    () => eventsApi.delete(event.id),
    { onSuccess: onRefresh },
  )

  return (
    <>
      {editing && (
        <EventFormModal event={event} onClose={() => setEditing(false)} onSaved={onRefresh} />
      )}
      {publishingWinners && (
        <PublishWinnersModal
          event={event}
          onClose={() => setPublishingWinners(false)}
          onPublished={onRefresh}
        />
      )}
      <tr className="hover:bg-gray-50/50 transition-colors">
        <td className="px-4 py-3">
          <Link
            to={`/events/${event.id}`}
            className="font-medium text-gray-900 hover:text-[#0D9488] text-sm line-clamp-1 block"
          >
            {event.title}
          </Link>
          <div className="text-xs text-gray-400 mt-0.5">
            {new Date(event.start_date).toLocaleDateString()}
          </div>
        </td>
        <td className="px-4 py-3 text-xs text-gray-600">
          {EVENT_TYPE_LABELS[event.event_type]}
        </td>
        <td className="px-4 py-3">
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
            event.is_published
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-500'
          }`}>
            {event.is_published ? 'Published' : 'Draft'}
          </span>
        </td>
        <td className="px-4 py-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" /> {event.registrations_count}
            {event.max_participants ? ` / ${event.max_participants}` : ''}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5 justify-end flex-wrap">
            <Link
              to={`/events/${event.id}`}
              className="inline-flex items-center gap-1 rounded-md bg-gray-50 border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
            >
              <Eye className="w-3 h-3" /> View
            </Link>

            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1 rounded-md bg-gray-50 border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
            >
              <Edit2 className="w-3 h-3" /> Edit
            </button>

            <button
              type="button"
              onClick={() => publishMutation.mutate(!event.is_published)}
              disabled={publishMutation.isLoading}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium disabled:opacity-50 ${
                event.is_published
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {publishMutation.isLoading
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : event.is_published
                ? <><GlobeLock className="w-3 h-3" /> Unpublish</>
                : <><Globe className="w-3 h-3" /> Publish</>}
            </button>

            {event.event_type === 'competition' && (
              <button
                type="button"
                onClick={() => setPublishingWinners(true)}
                className="inline-flex items-center gap-1 rounded-md bg-amber-500 px-2 py-1 text-xs font-medium text-white hover:bg-amber-600"
              >
                <Trophy className="w-3 h-3" /> Winners
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (window.confirm('Delete this event? This cannot be undone.')) {
                  deleteMutation.mutate()
                }
              }}
              disabled={deleteMutation.isLoading}
              className="inline-flex items-center gap-1 rounded-xl bg-red-600 hover:bg-red-700 px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
            >
              {deleteMutation.isLoading
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <Trash2 className="w-3 h-3" />}
            </button>
          </div>
        </td>
      </tr>
    </>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function EventManagement() {
  usePageTitle('Manage Events')
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [publishedFilter, setPublishedFilter] = useState('')
  const [page, setPage] = useState(1)
  const [creating, setCreating] = useState(false)

  const { data, isLoading, isFetching } = useQuery(
    ['admin-events', search, typeFilter, publishedFilter, page],
    () =>
      eventsApi
        .adminList({
          search: search || undefined,
          event_type: typeFilter || undefined,
          is_published: publishedFilter === '' ? undefined : publishedFilter === 'true',
          page,
        })
        .then((r) => r.data),
    { keepPreviousData: true },
  )

  const refresh = () => qc.invalidateQueries('admin-events')
  const totalPages = data ? Math.ceil(data.count / 20) : 1

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {creating && (
        <EventFormModal onClose={() => setCreating(false)} onSaved={refresh} />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Event Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">{data?.count ?? '—'} total events</p>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#093344] hover:bg-[#0D9488] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/50 focus:ring-offset-2"
        >
          <Plus className="w-4 h-4" /> Create Event
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search events…"
              className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] hover:border-gray-300"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
                aria-label="Filter by type"
                className="appearance-none pr-10 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] hover:border-gray-300"
              >
                <option value="">All types</option>
                {(Object.entries(EVENT_TYPE_LABELS) as [EventType, string][]).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <div className="relative">
              <select
                value={publishedFilter}
                onChange={(e) => { setPublishedFilter(e.target.value); setPage(1) }}
                aria-label="Filter by status"
                className="appearance-none pr-10 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] hover:border-gray-300"
              >
                <option value="">All statuses</option>
                <option value="true">Published</option>
                <option value="false">Draft</option>
              </select>
              <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          {isFetching && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : !data?.results.length ? (
          <div className="py-16 text-center text-sm text-gray-400">
            No events found.{' '}
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="text-[#0D9488] hover:underline"
            >
              Create one
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="text-left px-4 py-3 font-medium">Title</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Registrations</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.results.map((e) => (
                  <EventRow key={e.id} event={e} onRefresh={refresh} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && data.count > 20 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
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
      </div>
    </div>
  )
}
