import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Plus, FileText, Clock, ChevronRight, Loader2, Send } from 'lucide-react'
import { researchApi } from '@/api/research'
import { RESEARCH_CATEGORY_LABELS, RESEARCH_STATUS_LABELS } from '@/types/research'
import type { Research, ResearchStatus } from '@/types/research'

const STATUS_STYLES: Record<ResearchStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  submitted: 'bg-blue-100 text-blue-700',
  under_review: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  published: 'bg-emerald-100 text-emerald-700',
}

const STATUS_HINT: Record<ResearchStatus, string> = {
  draft: 'Not submitted yet — submit when ready.',
  submitted: 'Awaiting reviewer assignment.',
  under_review: 'Being reviewed. You will be notified of the outcome.',
  approved: 'Approved — awaiting publication by admin.',
  rejected: 'Not approved. See details below.',
  published: 'Publicly visible in the repository.',
}

function ResearchCard({ research, onSubmit }: { research: Research; onSubmit: (id: string) => void }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[research.status]}`}>
              {RESEARCH_STATUS_LABELS[research.status]}
            </span>
            <span className="text-xs text-gray-400">
              {RESEARCH_CATEGORY_LABELS[research.category]}
            </span>
          </div>

          <h3 className="font-semibold text-gray-900 text-sm">{research.title}</h3>

          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(research.created_at).toLocaleDateString()}
          </p>

          <p className="text-xs text-gray-500 mt-1">{STATUS_HINT[research.status]}</p>

          {research.status === 'rejected' && research.rejection_reason && (
            <p className="text-xs text-red-600 mt-1.5 bg-red-50 rounded px-2 py-1">
              Reason: {research.rejection_reason}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 items-end flex-shrink-0">
          {research.status === 'draft' && (
            <button
              type="button"
              onClick={() => onSubmit(research.id)}
              className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
            >
              <Send className="w-3 h-3" /> Submit
            </button>
          )}
          <Link
            to={`/research/${research.id}`}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            View <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function MyResearch() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery('my-research', () =>
    researchApi.myResearch().then((r) => r.data),
  )

  const submitMutation = useMutation(
    (id: string) => researchApi.submitDraft(id),
    { onSuccess: () => qc.invalidateQueries('my-research') },
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Research</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track your submissions</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/research/submit')}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> New Submission
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : !data?.results.length ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
          <FileText className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-sm text-gray-500 mb-4">No research submissions yet.</p>
          <button
            type="button"
            onClick={() => navigate('/research/submit')}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" /> Submit Your First Research
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {submitMutation.isLoading && (
            <div className="flex items-center gap-2 text-xs text-gray-500 px-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting…
            </div>
          )}
          {data.results.map((r) => (
            <ResearchCard
              key={r.id}
              research={r}
              onSubmit={(id) => submitMutation.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
