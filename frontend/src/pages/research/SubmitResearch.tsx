import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from 'react-query'
import { useForm } from 'react-hook-form'
import { Upload, ArrowLeft, Loader2, CheckCircle } from 'lucide-react'
import { researchApi } from '@/api/research'
import { RESEARCH_CATEGORY_LABELS } from '@/types/research'
import type { ResearchCategory } from '@/types/research'

interface FormValues {
  title: string
  abstract: string
  category: ResearchCategory
  keywords: string
  document: FileList
  dataset?: FileList
}

export default function SubmitResearch() {
  const navigate = useNavigate()
  const [submitMode, setSubmitMode] = useState<'draft' | 'submit'>('draft')
  const [success, setSuccess] = useState(false)
  const [docName, setDocName] = useState('')
  const [datasetName, setDatasetName] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>()

  const createMutation = useMutation(
    async (values: FormValues) => {
      const fd = new FormData()
      fd.append('title', values.title)
      fd.append('abstract', values.abstract)
      fd.append('category', values.category)
      fd.append('keywords', values.keywords)
      fd.append('document', values.document[0])
      if (values.dataset?.[0]) fd.append('dataset', values.dataset[0])
      const { data } = await researchApi.createDraft(fd)
      return data
    },
    {
      onSuccess: async (research) => {
        if (submitMode === 'submit') {
          await researchApi.submitDraft(research.id)
        }
        setSuccess(true)
      },
    },
  )

  if (success) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {submitMode === 'submit' ? 'Research Submitted!' : 'Draft Saved!'}
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          {submitMode === 'submit'
            ? 'Your research has been submitted for review. You will be notified of the outcome by email.'
            : 'Your draft has been saved. Submit it from My Research when ready.'}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={() => navigate('/research/my')}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            View My Research
          </button>
          <button
            type="button"
            onClick={() => navigate('/research')}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Browse Repository
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Submit Research</h1>
        <p className="text-sm text-gray-500 mt-1">
          Upload your research paper for review and publication.
        </p>
      </div>

      <form onSubmit={handleSubmit((values) => createMutation.mutate(values))} className="space-y-5">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              {...register('title', { required: 'Title is required' })}
              placeholder="Research title"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
          </div>

          {/* Abstract */}
          <div>
            <label htmlFor="abstract" className="block text-sm font-medium text-gray-700 mb-1">
              Abstract <span className="text-red-500">*</span>
            </label>
            <textarea
              id="abstract"
              {...register('abstract', { required: 'Abstract is required' })}
              rows={5}
              placeholder="Brief summary of your research (200–500 words recommended)"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.abstract && <p className="text-xs text-red-500 mt-1">{errors.abstract.message}</p>}
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              {...register('category', { required: 'Category is required' })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a category</option>
              {(Object.entries(RESEARCH_CATEGORY_LABELS) as [ResearchCategory, string][]).map(
                ([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ),
              )}
            </select>
            {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category.message}</p>}
          </div>

          {/* Keywords */}
          <div>
            <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-1">
              Keywords <span className="text-xs text-gray-400">(comma-separated)</span>
            </label>
            <input
              id="keywords"
              {...register('keywords')}
              placeholder="e.g. climate change, water quality, Tanzania"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* File uploads */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h2 className="text-sm font-semibold text-gray-700">Documents</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Research Paper (PDF or Word) <span className="text-red-500">*</span>
            </label>
            <label className="cursor-pointer inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
              <Upload className="w-4 h-4" />
              <span>{docName || 'Choose file…'}</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className="sr-only"
                {...register('document', { required: 'Research paper is required' })}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) setDocName(file.name)
                }}
              />
            </label>
            {errors.document && (
              <p className="text-xs text-red-500 mt-1">{errors.document.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dataset{' '}
              <span className="text-xs text-gray-400">(optional)</span>
            </label>
            <label className="cursor-pointer inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
              <Upload className="w-4 h-4" />
              <span>{datasetName || 'Choose file…'}</span>
              <input
                type="file"
                className="sr-only"
                {...register('dataset')}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) setDatasetName(file.name)
                }}
              />
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            onClick={() => setSubmitMode('draft')}
            disabled={createMutation.isLoading}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {createMutation.isLoading && submitMode === 'draft' ? (
              <span className="inline-flex items-center gap-2 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" /> Saving…
              </span>
            ) : 'Save as Draft'}
          </button>
          <button
            type="submit"
            onClick={() => setSubmitMode('submit')}
            disabled={createMutation.isLoading}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {createMutation.isLoading && submitMode === 'submit' ? (
              <span className="inline-flex items-center gap-2 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" /> Submitting…
              </span>
            ) : 'Submit for Review'}
          </button>
        </div>

        {createMutation.isError && (
          <p className="text-sm text-red-600 text-center">
            Something went wrong. Please try again.
          </p>
        )}
      </form>
    </div>
  )
}
