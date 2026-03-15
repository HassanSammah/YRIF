import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useState } from 'react'
import {
  Download, Eye, ArrowLeft, Calendar, User, Tag,
  Loader2, CheckCircle, XCircle, FileText, MessageSquare, GitBranch, Users,
} from 'lucide-react'
import { researchApi } from '@/api/research'
import { useAuth } from '@/hooks/useAuth'
import { RESEARCH_CATEGORY_LABELS, RESEARCH_STATUS_LABELS } from '@/types/research'
import type { ResearchStatus } from '@/types/research'

const STATUS_STYLES: Record<ResearchStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  submitted: 'bg-blue-100 text-blue-700',
  under_review: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  published: 'bg-emerald-100 text-emerald-700',
}

export default function ResearchDetail() {
  const { id } = useParams<{ id: string }>()
  const { user, isAdmin } = useAuth()
  const qc = useQueryClient()
  const [commentForm, setCommentForm] = useState({ comments: '', decision: 'approve' })
  const [showCommentForm, setShowCommentForm] = useState(false)

  const { data: research, isLoading, error } = useQuery(
    ['research', id],
    () => researchApi.get(id!).then((r) => r.data),
    { enabled: !!id },
  )

  const downloadMutation = useMutation(
    () => researchApi.getDownloadUrl(id!).then((r) => r.data),
    {
      onSuccess: (data) => {
        window.open(data.document_url, '_blank')
      },
    },
  )

  const commentMutation = useMutation(
    (data: { comments: string; decision: string }) => researchApi.addComment(id!, data),
    {
      onSuccess: () => {
        qc.invalidateQueries(['research', id])
        setShowCommentForm(false)
        setCommentForm({ comments: '', decision: 'approve' })
      },
    },
  )

  const decideMutation = useMutation(
    (data: { decision: 'approve' | 'reject'; reason?: string }) =>
      researchApi.decide(id!, data),
    { onSuccess: () => qc.invalidateQueries(['research', id]) },
  )

  const publishMutation = useMutation(
    () => researchApi.publish(id!),
    { onSuccess: () => qc.invalidateQueries(['research', id]) },
  )

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error || !research) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center text-gray-400">
        Research not found.
      </div>
    )
  }

  const isAuthor = user?.id === research.author
  const isAssignedReviewer = research.assignments?.some((a) => a.reviewer === user?.id)
  const canComment = isAssignedReviewer || isAdmin

  // Collaboration settings state
  const [collabOpen, setCollabOpen] = useState(research.open_for_collaboration ?? false)
  const [collabDesc, setCollabDesc] = useState(research.collaboration_description ?? '')
  const [collabSaved, setCollabSaved] = useState(false)

  const collabSettingsMutation = useMutation(
    (data: { open_for_collaboration: boolean; collaboration_description: string }) =>
      researchApi.updateCollabSettings(id!, data),
    {
      onSuccess: (res) => {
        qc.invalidateQueries(['research', id])
        setCollabOpen(res.data.open_for_collaboration ?? false)
        setCollabDesc(res.data.collaboration_description ?? '')
        setCollabSaved(true)
        setTimeout(() => setCollabSaved(false), 3000)
      },
    },
  )

  const joinRequestDecideMutation = useMutation(
    ({ requestId, status }: { requestId: string; status: 'accepted' | 'declined' }) =>
      researchApi.decideJoinRequest(requestId, status),
    { onSuccess: () => qc.invalidateQueries(['research', id]) },
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        to="/research"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Repository
      </Link>

      {/* Main card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4">
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[research.status]}`}>
            {RESEARCH_STATUS_LABELS[research.status]}
          </span>
          <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-50 text-blue-700">
            {RESEARCH_CATEGORY_LABELS[research.category]}
          </span>
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-3">{research.title}</h1>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">{research.abstract}</p>

        <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-4">
          <span className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" /> {research.author_name}
          </span>
          {research.published_at && (
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(research.published_at).toLocaleDateString()}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" /> {research.views_count} views
          </span>
          <span className="flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> {research.downloads_count} downloads
          </span>
        </div>

        {research.keywords && (
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <Tag className="w-3.5 h-3.5 text-gray-400" />
            {research.keywords
              .split(',')
              .filter(Boolean)
              .map((kw, i) => (
                <span key={i} className="inline-flex rounded px-2 py-0.5 text-xs bg-gray-100 text-gray-600">
                  {kw.trim()}
                </span>
              ))}
          </div>
        )}

        {research.status === 'published' && (
          <button
            onClick={() => downloadMutation.mutate()}
            disabled={downloadMutation.isLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-[#093344] hover:bg-[#0D9488] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 disabled:opacity-50"
          >
            {downloadMutation.isLoading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Download className="w-4 h-4" />}
            Download Paper
          </button>
        )}

        {/* Rejection reason */}
        {research.status === 'rejected' && research.rejection_reason && (isAuthor || isAdmin) && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-100 p-3">
            <p className="text-xs font-medium text-red-700 mb-1">Rejection Reason</p>
            <p className="text-sm text-red-600">{research.rejection_reason}</p>
          </div>
        )}
      </div>

      {/* Admin actions */}
      {isAdmin && research.status !== 'published' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Admin Actions</h2>
          <div className="flex flex-wrap gap-2">
            {research.status === 'approved' && (
              <button
                onClick={() => publishMutation.mutate()}
                disabled={publishMutation.isLoading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 disabled:opacity-50 hover:bg-emerald-700"
              >
                {publishMutation.isLoading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <CheckCircle className="w-4 h-4" />}
                Publish
              </button>
            )}
            {(research.status === 'submitted' || research.status === 'under_review') && (
              <>
                <button
                  onClick={() => decideMutation.mutate({ decision: 'approve' })}
                  disabled={decideMutation.isLoading}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 disabled:opacity-50 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4" /> Approve
                </button>
                <button
                  onClick={() => {
                    const reason = window.prompt('Rejection reason (optional):') ?? ''
                    decideMutation.mutate({ decision: 'reject', reason })
                  }}
                  disabled={decideMutation.isLoading}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white text-red-700 hover:border-red-300 hover:bg-red-50 px-4 py-2.5 text-sm font-semibold transition-all duration-200 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Reviewer comment form */}
      {canComment && research.status === 'under_review' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Add Review Comment</h2>
            <button
              onClick={() => setShowCommentForm((v) => !v)}
              className="text-xs text-blue-600 hover:underline"
            >
              {showCommentForm ? 'Cancel' : 'Write Comment'}
            </button>
          </div>
          {showCommentForm && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                commentMutation.mutate(commentForm)
              }}
              className="space-y-3"
            >
              <textarea
                value={commentForm.comments}
                onChange={(e) => setCommentForm((f) => ({ ...f, comments: e.target.value }))}
                required
                rows={4}
                placeholder="Your review comments…"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] hover:border-gray-300 resize-none"
              />
              <div className="flex items-center gap-3">
                <select
                  value={commentForm.decision}
                  onChange={(e) => setCommentForm((f) => ({ ...f, decision: e.target.value }))}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] hover:border-gray-300"
                >
                  <option value="approve">Recommend Approval</option>
                  <option value="reject">Recommend Rejection</option>
                  <option value="revise">Request Revision</option>
                </select>
                <button
                  type="submit"
                  disabled={commentMutation.isLoading}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#093344] hover:bg-[#0D9488] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 disabled:opacity-50"
                >
                  {commentMutation.isLoading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : 'Submit'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Review comments (author + admin view) */}
      {(isAdmin || isAuthor) && !!research.reviews?.length && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Review Comments ({research.reviews.length})
          </h2>
          <div className="space-y-3">
            {research.reviews.map((rv) => (
              <div key={rv.id} className="rounded-lg bg-gray-50 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700">{rv.reviewer_name}</span>
                  <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${
                    rv.decision === 'approve'
                      ? 'bg-green-100 text-green-700'
                      : rv.decision === 'reject'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {rv.decision === 'approve' ? 'Approve' : rv.decision === 'reject' ? 'Reject' : 'Revise'}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{rv.comments}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviewer assignments (admin only) */}
      {isAdmin && !!research.assignments?.length && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Reviewer Assignments
          </h2>
          <div className="space-y-2">
            {research.assignments.map((a) => (
              <div key={a.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{a.reviewer_name}</span>
                <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${
                  a.state === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {a.state === 'completed' ? 'Completed' : 'Assigned'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collaboration Settings (author only, for submitted/active research) */}
      {isAuthor && research.status !== 'draft' && research.status !== 'rejected' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-[#0D9488]" />
            RA Collaboration
          </h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setCollabOpen(v => !v)}
                className={`relative w-10 h-5.5 rounded-full transition-colors cursor-pointer ${collabOpen ? 'bg-[#0D9488]' : 'bg-gray-200'}`}
                style={{ height: '22px', width: '40px', flexShrink: 0 }}
              >
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${collabOpen ? 'translate-x-[18px]' : ''}`} />
              </div>
              <span className="text-sm text-gray-700">
                {collabOpen ? 'Open for RA collaboration' : 'Not open for collaboration'}
              </span>
            </label>
            {collabOpen && (
              <textarea
                value={collabDesc}
                onChange={(e) => setCollabDesc(e.target.value)}
                placeholder="Describe what kind of RA support you're looking for (optional)…"
                rows={3}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] resize-none"
              />
            )}
            <div className="flex items-center gap-3">
              <button
                onClick={() => collabSettingsMutation.mutate({ open_for_collaboration: collabOpen, collaboration_description: collabDesc })}
                disabled={collabSettingsMutation.isLoading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#093344] hover:bg-[#0D9488] px-3 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-60"
              >
                {collabSettingsMutation.isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                Save
              </button>
              {collabSaved && <span className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Saved</span>}
            </div>
          </div>
        </div>
      )}

      {/* RA Join Requests (author only) */}
      {isAuthor && !!research.ra_join_requests?.filter(r => r.status === 'pending').length && (
        <div className="bg-white rounded-xl border border-[#0D9488]/20 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#0D9488]" />
            RA Join Requests ({research.ra_join_requests.filter(r => r.status === 'pending').length} pending)
          </h2>
          <div className="space-y-3">
            {research.ra_join_requests.filter(r => r.status === 'pending').map((req) => (
              <div key={req.id} className="flex items-start justify-between gap-4 rounded-lg bg-gray-50 p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{req.ra_name}</p>
                  <p className="text-xs text-gray-500">{req.ra_email}</p>
                  {req.message && <p className="text-xs text-gray-600 mt-1">{req.message}</p>}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => joinRequestDecideMutation.mutate({ requestId: req.id, status: 'accepted' })}
                    disabled={joinRequestDecideMutation.isLoading}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-60"
                  >
                    <CheckCircle className="w-3 h-3" /> Accept
                  </button>
                  <button
                    onClick={() => joinRequestDecideMutation.mutate({ requestId: req.id, status: 'declined' })}
                    disabled={joinRequestDecideMutation.isLoading}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors disabled:opacity-60"
                  >
                    <XCircle className="w-3 h-3" /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
