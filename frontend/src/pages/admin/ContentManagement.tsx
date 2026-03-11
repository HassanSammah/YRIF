import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm, Controller } from 'react-hook-form'
import {
  Plus, Pencil, Trash2, Search, Loader2, X,
  BookOpen, FileText, Database, Video, Play, Eye, Download,
  Bell, Newspaper,
} from 'lucide-react'
import { resourcesApi } from '@/api/resources'
import type { Resource, Webinar, ResourceType, ResourceWriteData, WebinarWriteData } from '@/types/resources'
import { RESOURCE_TYPE_LABELS } from '@/types/resources'
import { adminApi } from '@/api/admin'
import type { Announcement, NewsPost } from '@/types/admin'

// ── Helpers ───────────────────────────────────────────────────────────────────

const RESOURCE_TYPES: ResourceType[] = ['guide', 'template', 'dataset', 'webinar', 'recording', 'other']

const TYPE_ICONS: Record<ResourceType, React.ComponentType<any>> = {
  guide: BookOpen,
  template: FileText,
  dataset: Database,
  webinar: Video,
  recording: Play,
  other: FileText,
}

function TagInput({
  value,
  onChange,
}: {
  value: string[]
  onChange: (tags: string[]) => void
}) {
  const [input, setInput] = useState('')

  const add = () => {
    const tag = input.trim()
    if (tag && !value.includes(tag)) onChange([...value, tag])
    setInput('')
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder="Add tag and press Enter"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={add}
          className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200"
        >
          Add
        </button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
            >
              {tag}
              <button
                type="button"
                onClick={() => onChange(value.filter((t) => t !== tag))}
                className="hover:text-blue-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Resource Form Modal ───────────────────────────────────────────────────────

interface ResourceFormProps {
  resource?: Resource
  onClose: () => void
}

function ResourceFormModal({ resource, onClose }: ResourceFormProps) {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const isEdit = !!resource

  const { register, handleSubmit, control, formState: { errors } } = useForm<ResourceWriteData & { file?: FileList }>({
    defaultValues: {
      title: resource?.title ?? '',
      description: resource?.description ?? '',
      resource_type: resource?.resource_type ?? 'guide',
      external_url: resource?.external_url ?? '',
      tags: resource?.tags ?? [],
      is_published: resource?.is_published ?? true,
    },
  })

  const mutation = useMutation(
    (data: ResourceWriteData & { file?: FileList }) => {
      const hasFile = data.file && data.file.length > 0
      if (hasFile) {
        const fd = new FormData()
        fd.append('title', data.title)
        fd.append('description', data.description ?? '')
        fd.append('resource_type', data.resource_type)
        fd.append('external_url', data.external_url ?? '')
        fd.append('is_published', String(data.is_published ?? true))
        if (data.tags) data.tags.forEach((t) => fd.append('tags', t))
        fd.append('file', data.file![0])
        return isEdit
          ? resourcesApi.adminUpdateResource(resource!.id, fd)
          : resourcesApi.adminCreateResource(fd)
      }
      const { file: _f, ...rest } = data
      return isEdit
        ? resourcesApi.adminUpdateResource(resource!.id, rest)
        : resourcesApi.adminCreateResource(rest)
    },
    {
      onSuccess: () => {
        qc.invalidateQueries('admin-resources')
        onClose()
      },
    },
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">
            {isEdit ? 'Edit Resource' : 'New Resource'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit((d) => mutation.mutate(d))}
          className="p-6 space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              {...register('title', { required: 'Title is required' })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Type <span className="text-red-500">*</span></label>
            <select
              {...register('resource_type', { required: true })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {RESOURCE_TYPES.map((t) => (
                <option key={t} value={t}>{RESOURCE_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">External URL</label>
            <input
              {...register('external_url')}
              type="url"
              placeholder="https://…"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Upload File <span className="text-gray-400">(optional)</span>
            </label>
            <input
              {...register('file')}
              type="file"
              ref={fileRef}
              className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {resource?.file_url && (
              <p className="text-xs text-gray-400 mt-1">Current: {resource.file_url}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Tags</label>
            <Controller
              name="tags"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <TagInput value={field.value ?? []} onChange={field.onChange} />
              )}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              {...register('is_published')}
              type="checkbox"
              id="res-published"
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="res-published" className="text-sm text-gray-700">Published</label>
          </div>

          {mutation.isError && (
            <p className="text-xs text-red-600">Something went wrong. Please check your inputs.</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {mutation.isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Webinar Form Modal ────────────────────────────────────────────────────────

interface WebinarFormProps {
  webinar?: Webinar
  onClose: () => void
}

function WebinarFormModal({ webinar, onClose }: WebinarFormProps) {
  const qc = useQueryClient()
  const isEdit = !!webinar

  // Convert ISO string to datetime-local format
  const toLocalInput = (iso?: string) => {
    if (!iso) return ''
    return iso.slice(0, 16)
  }

  const { register, handleSubmit, control, formState: { errors } } = useForm<WebinarWriteData>({
    defaultValues: {
      title: webinar?.title ?? '',
      description: webinar?.description ?? '',
      scheduled_at: toLocalInput(webinar?.scheduled_at),
      registration_link: webinar?.registration_link ?? '',
      recording_url: webinar?.recording_url ?? '',
      tags: webinar?.tags ?? [],
      is_published: webinar?.is_published ?? true,
    },
  })

  const mutation = useMutation(
    (data: WebinarWriteData) => {
      const payload = { ...data, scheduled_at: new Date(data.scheduled_at).toISOString() }
      return isEdit
        ? resourcesApi.adminUpdateWebinar(webinar!.id, payload)
        : resourcesApi.adminCreateWebinar(payload)
    },
    {
      onSuccess: () => {
        qc.invalidateQueries('admin-webinars')
        onClose()
      },
    },
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">
            {isEdit ? 'Edit Webinar' : 'New Webinar'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              {...register('title', { required: 'Title is required' })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Date & Time <span className="text-red-500">*</span>
            </label>
            <input
              {...register('scheduled_at', { required: 'Date is required' })}
              type="datetime-local"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.scheduled_at && <p className="mt-1 text-xs text-red-600">{errors.scheduled_at.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Registration Link</label>
            <input
              {...register('registration_link')}
              type="url"
              placeholder="https://…"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Recording URL</label>
            <input
              {...register('recording_url')}
              type="url"
              placeholder="https://… (fill after the session)"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Tags</label>
            <Controller
              name="tags"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <TagInput value={field.value ?? []} onChange={field.onChange} />
              )}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              {...register('is_published')}
              type="checkbox"
              id="web-published"
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="web-published" className="text-sm text-gray-700">Published</label>
          </div>

          {mutation.isError && (
            <p className="text-xs text-red-600">Something went wrong. Please check your inputs.</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {mutation.isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Delete Confirm ────────────────────────────────────────────────────────────

function DeleteConfirm({
  title,
  onConfirm,
  onCancel,
  loading,
}: {
  title: string
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
        <p className="text-sm font-medium text-gray-900 mb-1">Delete "{title}"?</p>
        <p className="text-xs text-gray-500 mb-5">This action cannot be undone.</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onCancel}
            className="rounded-xl border border-gray-200 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Resources Tab ─────────────────────────────────────────────────────────────

function ResourcesTab() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [pubFilter, setPubFilter] = useState('')
  const [page, setPage] = useState(1)
  const [editTarget, setEditTarget] = useState<Resource | undefined>()
  const [showCreate, setShowCreate] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Resource | undefined>()

  const { data, isLoading, isFetching } = useQuery(
    ['admin-resources', search, typeFilter, pubFilter, page],
    () =>
      resourcesApi
        .adminListResources({
          search: search || undefined,
          resource_type: typeFilter || undefined,
          is_published: pubFilter === '' ? undefined : pubFilter === 'true',
          page,
        })
        .then((r) => r.data),
    { keepPreviousData: true },
  )

  const deleteMutation = useMutation(
    (id: string) => resourcesApi.adminDeleteResource(id),
    { onSuccess: () => { qc.invalidateQueries('admin-resources'); setDeleteTarget(undefined) } },
  )

  const totalPages = Math.ceil((data?.count ?? 0) / 20)

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center mb-4">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search resources…"
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All types</option>
          {RESOURCE_TYPES.map((t) => <option key={t} value={t}>{RESOURCE_TYPE_LABELS[t]}</option>)}
        </select>
        <select
          value={pubFilter}
          onChange={(e) => { setPubFilter(e.target.value); setPage(1) }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All</option>
          <option value="true">Published</option>
          <option value="false">Unpublished</option>
        </select>
        {isFetching && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
        <button
          onClick={() => setShowCreate(true)}
          className="ml-auto inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> New Resource
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
        ) : !data?.results.length ? (
          <div className="py-16 text-center text-sm text-gray-400">No resources found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="text-left px-4 py-3 font-medium">Title</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Stats</th>
                  <th className="text-left px-4 py-3 font-medium">Added</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.results.map((res) => {
                  const Icon = TYPE_ICONS[res.resource_type]
                  return (
                    <tr key={res.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 max-w-xs">
                        <div className="flex items-start gap-2">
                          <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-gray-900 line-clamp-1">{res.title}</p>
                            {res.tags.length > 0 && (
                              <p className="text-xs text-gray-400">{res.tags.join(', ')}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {RESOURCE_TYPE_LABELS[res.resource_type]}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${res.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {res.is_published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{res.views_count}</span>
                          <span className="flex items-center gap-1"><Download className="w-3 h-3" />{res.downloads_count}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {new Date(res.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setEditTarget(res)}
                            className="rounded-md bg-gray-100 p-1.5 text-gray-500 hover:bg-gray-200"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(res)}
                            className="rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {data && data.count > 20 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="rounded-lg p-1.5 hover:bg-gray-100 disabled:opacity-40">
                ‹
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="rounded-lg p-1.5 hover:bg-gray-100 disabled:opacity-40">
                ›
              </button>
            </div>
          </div>
        )}
      </div>

      {showCreate && <ResourceFormModal onClose={() => setShowCreate(false)} />}
      {editTarget && <ResourceFormModal resource={editTarget} onClose={() => setEditTarget(undefined)} />}
      {deleteTarget && (
        <DeleteConfirm
          title={deleteTarget.title}
          loading={deleteMutation.isLoading}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(undefined)}
        />
      )}
    </>
  )
}

// ── Webinars Tab ──────────────────────────────────────────────────────────────

function WebinarsTab() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [pubFilter, setPubFilter] = useState('')
  const [page, setPage] = useState(1)
  const [editTarget, setEditTarget] = useState<Webinar | undefined>()
  const [showCreate, setShowCreate] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Webinar | undefined>()

  const { data, isLoading, isFetching } = useQuery(
    ['admin-webinars', search, pubFilter, page],
    () =>
      resourcesApi
        .adminListWebinars({
          search: search || undefined,
          is_published: pubFilter === '' ? undefined : pubFilter === 'true',
          page,
        })
        .then((r) => r.data),
    { keepPreviousData: true },
  )

  const deleteMutation = useMutation(
    (id: string) => resourcesApi.adminDeleteWebinar(id),
    { onSuccess: () => { qc.invalidateQueries('admin-webinars'); setDeleteTarget(undefined) } },
  )

  const totalPages = Math.ceil((data?.count ?? 0) / 20)

  return (
    <>
      <div className="flex flex-wrap gap-3 items-center mb-4">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search webinars…"
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={pubFilter}
          onChange={(e) => { setPubFilter(e.target.value); setPage(1) }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All</option>
          <option value="true">Published</option>
          <option value="false">Unpublished</option>
        </select>
        {isFetching && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
        <button
          onClick={() => setShowCreate(true)}
          className="ml-auto inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> New Webinar
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
        ) : !data?.results.length ? (
          <div className="py-16 text-center text-sm text-gray-400">No webinars found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="text-left px-4 py-3 font-medium">Title</th>
                  <th className="text-left px-4 py-3 font-medium">Scheduled</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Recording</th>
                  <th className="text-left px-4 py-3 font-medium">Views</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.results.map((web) => (
                  <tr key={web.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 max-w-xs">
                      <p className="font-medium text-gray-900 line-clamp-1">{web.title}</p>
                      {web.tags.length > 0 && (
                        <p className="text-xs text-gray-400">{web.tags.join(', ')}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      <div>{new Date(web.scheduled_at).toLocaleDateString()}</div>
                      <div className={`mt-0.5 ${web.is_past ? 'text-gray-400' : 'text-green-600'}`}>
                        {web.is_past ? 'Past' : 'Upcoming'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${web.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {web.is_published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {web.recording_url
                        ? <span className="text-green-600 font-medium">✓ Available</span>
                        : <span className="text-gray-400">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />{web.views_count}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setEditTarget(web)}
                          className="rounded-md bg-gray-100 p-1.5 text-gray-500 hover:bg-gray-200"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(web)}
                          className="rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && data.count > 20 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="rounded-lg p-1.5 hover:bg-gray-100 disabled:opacity-40">‹</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="rounded-lg p-1.5 hover:bg-gray-100 disabled:opacity-40">›</button>
            </div>
          </div>
        )}
      </div>

      {showCreate && <WebinarFormModal onClose={() => setShowCreate(false)} />}
      {editTarget && <WebinarFormModal webinar={editTarget} onClose={() => setEditTarget(undefined)} />}
      {deleteTarget && (
        <DeleteConfirm
          title={deleteTarget.title}
          loading={deleteMutation.isLoading}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(undefined)}
        />
      )}
    </>
  )
}

// ── Announcement Form Modal ───────────────────────────────────────────────────

interface AnnouncementFormProps {
  item?: Announcement
  onClose: () => void
}

function AnnouncementFormModal({ item, onClose }: AnnouncementFormProps) {
  const qc = useQueryClient()
  const isEdit = !!item

  const { register, handleSubmit, formState: { errors } } = useForm<{
    title: string
    content: string
    is_published: boolean
  }>({
    defaultValues: {
      title: item?.title ?? '',
      content: item?.content ?? '',
      is_published: item?.is_published ?? false,
    },
  })

  const mutation = useMutation(
    (data: { title: string; content: string; is_published: boolean }) =>
      isEdit
        ? adminApi.updateAnnouncement(item!.id, data)
        : adminApi.createAnnouncement(data),
    {
      onSuccess: () => {
        qc.invalidateQueries('admin-announcements')
        onClose()
      },
    },
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">
            {isEdit ? 'Edit Announcement' : 'New Announcement'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              {...register('title', { required: 'Title is required' })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Content <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('content', { required: 'Content is required' })}
              rows={6}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            {errors.content && <p className="mt-1 text-xs text-red-600">{errors.content.message}</p>}
          </div>
          <div className="flex items-center gap-2">
            <input
              {...register('is_published')}
              type="checkbox"
              id="ann-published"
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="ann-published" className="text-sm text-gray-700">Publish immediately</label>
          </div>
          {mutation.isError && (
            <p className="text-xs text-red-600">Something went wrong. Please try again.</p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="rounded-xl border border-gray-200 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {mutation.isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Announcements Tab ─────────────────────────────────────────────────────────

function AnnouncementsTab() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [pubFilter, setPubFilter] = useState('')
  const [page, setPage] = useState(1)
  const [editTarget, setEditTarget] = useState<Announcement | undefined>()
  const [showCreate, setShowCreate] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Announcement | undefined>()

  const { data, isLoading, isFetching } = useQuery(
    ['admin-announcements', search, pubFilter, page],
    () =>
      adminApi
        .listAnnouncements({
          search: search || undefined,
          is_published: pubFilter === '' ? undefined : pubFilter === 'true',
          page,
        })
        .then((r) => r.data),
    { keepPreviousData: true },
  )

  const deleteMutation = useMutation(
    (id: string) => adminApi.deleteAnnouncement(id),
    { onSuccess: () => { qc.invalidateQueries('admin-announcements'); setDeleteTarget(undefined) } },
  )

  const totalPages = Math.ceil((data?.count ?? 0) / 20)

  return (
    <>
      <div className="flex flex-wrap gap-3 items-center mb-4">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search announcements…"
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={pubFilter}
          onChange={(e) => { setPubFilter(e.target.value); setPage(1) }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All</option>
          <option value="true">Published</option>
          <option value="false">Draft</option>
        </select>
        {isFetching && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
        <button
          onClick={() => setShowCreate(true)}
          className="ml-auto inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> New Announcement
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
        ) : !data?.results.length ? (
          <div className="py-16 text-center text-sm text-gray-400">No announcements found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="text-left px-4 py-3 font-medium">Title</th>
                  <th className="text-left px-4 py-3 font-medium">Author</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Published</th>
                  <th className="text-left px-4 py-3 font-medium">Created</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.results.map((ann) => (
                  <tr key={ann.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 max-w-xs">
                      <div className="flex items-start gap-2">
                        <Bell className="w-4 h-4 text-pink-400 mt-0.5 flex-shrink-0" />
                        <p className="font-medium text-gray-900 line-clamp-1">{ann.title}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{ann.author_name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ann.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {ann.is_published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {ann.published_at ? new Date(ann.published_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(ann.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => setEditTarget(ann)}
                          className="rounded-md bg-gray-100 p-1.5 text-gray-500 hover:bg-gray-200">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteTarget(ann)}
                          className="rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && data.count > 20 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="rounded-lg p-1.5 hover:bg-gray-100 disabled:opacity-40">‹</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="rounded-lg p-1.5 hover:bg-gray-100 disabled:opacity-40">›</button>
            </div>
          </div>
        )}
      </div>

      {showCreate && <AnnouncementFormModal onClose={() => setShowCreate(false)} />}
      {editTarget && <AnnouncementFormModal item={editTarget} onClose={() => setEditTarget(undefined)} />}
      {deleteTarget && (
        <DeleteConfirm
          title={deleteTarget.title}
          loading={deleteMutation.isLoading}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(undefined)}
        />
      )}
    </>
  )
}

// ── News Form Modal ───────────────────────────────────────────────────────────

interface NewsFormProps {
  item?: NewsPost
  onClose: () => void
}

function NewsFormModal({ item, onClose }: NewsFormProps) {
  const qc = useQueryClient()
  const isEdit = !!item

  const { register, handleSubmit, formState: { errors } } = useForm<{
    title: string
    slug: string
    body: string
    is_published: boolean
  }>({
    defaultValues: {
      title: item?.title ?? '',
      slug: item?.slug ?? '',
      body: item?.body ?? '',
      is_published: item?.is_published ?? false,
    },
  })

  const mutation = useMutation(
    (data: { title: string; slug: string; body: string; is_published: boolean }) =>
      isEdit
        ? adminApi.updateNews(item!.slug, data)
        : adminApi.createNews(data),
    {
      onSuccess: () => {
        qc.invalidateQueries('admin-news')
        onClose()
      },
    },
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">
            {isEdit ? 'Edit News Post' : 'New News Post'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              {...register('title', { required: 'Title is required' })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
          </div>
          {!isEdit && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Slug <span className="text-red-500">*</span>
                <span className="ml-1 font-normal text-gray-400">(URL-friendly, e.g. my-news-post)</span>
              </label>
              <input
                {...register('slug', { required: 'Slug is required', pattern: { value: /^[a-z0-9-]+$/, message: 'Lowercase letters, numbers and hyphens only' } })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug.message}</p>}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Body <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('body', { required: 'Body is required' })}
              rows={8}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            {errors.body && <p className="mt-1 text-xs text-red-600">{errors.body.message}</p>}
          </div>
          <div className="flex items-center gap-2">
            <input
              {...register('is_published')}
              type="checkbox"
              id="news-published"
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="news-published" className="text-sm text-gray-700">Publish immediately</label>
          </div>
          {mutation.isError && (
            <p className="text-xs text-red-600">Something went wrong. Please try again.</p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="rounded-xl border border-gray-200 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {mutation.isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Publish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── News Tab ──────────────────────────────────────────────────────────────────

function NewsTab() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [pubFilter, setPubFilter] = useState('')
  const [page, setPage] = useState(1)
  const [editTarget, setEditTarget] = useState<NewsPost | undefined>()
  const [showCreate, setShowCreate] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<NewsPost | undefined>()

  const { data, isLoading, isFetching } = useQuery(
    ['admin-news', search, pubFilter, page],
    () =>
      adminApi
        .listNews({
          search: search || undefined,
          is_published: pubFilter === '' ? undefined : pubFilter === 'true',
          page,
        })
        .then((r) => r.data),
    { keepPreviousData: true },
  )

  const deleteMutation = useMutation(
    (slug: string) => adminApi.deleteNews(slug),
    { onSuccess: () => { qc.invalidateQueries('admin-news'); setDeleteTarget(undefined) } },
  )

  const totalPages = Math.ceil((data?.count ?? 0) / 20)

  return (
    <>
      <div className="flex flex-wrap gap-3 items-center mb-4">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search news posts…"
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={pubFilter}
          onChange={(e) => { setPubFilter(e.target.value); setPage(1) }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All</option>
          <option value="true">Published</option>
          <option value="false">Draft</option>
        </select>
        {isFetching && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
        <button
          onClick={() => setShowCreate(true)}
          className="ml-auto inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> New Post
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
        ) : !data?.results.length ? (
          <div className="py-16 text-center text-sm text-gray-400">No news posts found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="text-left px-4 py-3 font-medium">Title</th>
                  <th className="text-left px-4 py-3 font-medium">Slug</th>
                  <th className="text-left px-4 py-3 font-medium">Author</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Published</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.results.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 max-w-xs">
                      <div className="flex items-start gap-2">
                        <Newspaper className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                        <p className="font-medium text-gray-900 line-clamp-1">{post.title}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono">{post.slug}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{post.author_name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${post.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {post.is_published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {post.published_at ? new Date(post.published_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => setEditTarget(post)}
                          className="rounded-md bg-gray-100 p-1.5 text-gray-500 hover:bg-gray-200">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteTarget(post)}
                          className="rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && data.count > 20 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="rounded-lg p-1.5 hover:bg-gray-100 disabled:opacity-40">‹</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="rounded-lg p-1.5 hover:bg-gray-100 disabled:opacity-40">›</button>
            </div>
          </div>
        )}
      </div>

      {showCreate && <NewsFormModal onClose={() => setShowCreate(false)} />}
      {editTarget && <NewsFormModal item={editTarget} onClose={() => setEditTarget(undefined)} />}
      {deleteTarget && (
        <DeleteConfirm
          title={deleteTarget.title}
          loading={deleteMutation.isLoading}
          onConfirm={() => deleteMutation.mutate(deleteTarget.slug)}
          onCancel={() => setDeleteTarget(undefined)}
        />
      )}
    </>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ContentManagement() {
  const [tab, setTab] = useState<'resources' | 'webinars' | 'announcements' | 'news'>('resources')

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Content Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage resources, webinars, announcements, and news.</p>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-6 flex-wrap">
        {([
          { key: 'resources', label: 'Resources' },
          { key: 'webinars', label: 'Webinars' },
          { key: 'announcements', label: 'Announcements' },
          { key: 'news', label: 'News & Blog' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-lg px-5 py-1.5 text-sm font-medium transition-colors ${
              tab === key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'resources' && <ResourcesTab />}
      {tab === 'webinars' && <WebinarsTab />}
      {tab === 'announcements' && <AnnouncementsTab />}
      {tab === 'news' && <NewsTab />}
    </div>
  )
}
