import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from 'react-query'
import { useForm } from 'react-hook-form'
import { Upload, ArrowLeft, CheckCircle } from 'lucide-react'
import { researchApi } from '@/api/research'
import { RESEARCH_CATEGORY_LABELS } from '@/types/research'
import type { ResearchCategory } from '@/types/research'
import {
  Field,
  inputCls,
  PrimaryButton,
  SecondaryButton,
  FormError,
} from '@/components/ui'

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
          <PrimaryButton type="button" onClick={() => navigate('/research/my')}>
            View My Research
          </PrimaryButton>
          <SecondaryButton type="button" onClick={() => navigate('/research')}>
            Browse Repository
          </SecondaryButton>
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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          {/* Title */}
          <Field id="title" label="Title" required error={errors.title?.message}>
            <input
              id="title"
              {...register('title', { required: 'Title is required' })}
              placeholder="Research title"
              className={inputCls(!!errors.title)}
            />
          </Field>

          {/* Abstract */}
          <Field id="abstract" label="Abstract" required error={errors.abstract?.message}>
            <textarea
              id="abstract"
              {...register('abstract', { required: 'Abstract is required' })}
              rows={5}
              placeholder="Brief summary of your research (200–500 words recommended)"
              className={inputCls(!!errors.abstract, 'resize-none')}
            />
          </Field>

          {/* Category */}
          <Field id="category" label="Category" required error={errors.category?.message}>
            <div className="relative">
              <select
                id="category"
                {...register('category', { required: 'Category is required' })}
                className={inputCls(!!errors.category, 'appearance-none pr-10 cursor-pointer')}
              >
                <option value="">Select a category</option>
                {(Object.entries(RESEARCH_CATEGORY_LABELS) as [ResearchCategory, string][]).map(
                  ([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ),
                )}
              </select>
              <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </Field>

          {/* Keywords */}
          <Field
            id="keywords"
            label="Keywords"
            hint="Separate multiple keywords with commas"
          >
            <input
              id="keywords"
              {...register('keywords')}
              placeholder="e.g. climate change, water quality, Tanzania"
              className={inputCls(false)}
            />
          </Field>
        </div>

        {/* File uploads */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h2 className="text-sm font-semibold text-[#093344]">Documents</h2>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Research Paper (PDF or Word) <span className="text-red-500 ml-0.5">*</span>
            </label>
            <label className="cursor-pointer inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-gray-200 hover:border-[#0D9488] hover:bg-teal-50/30 px-4 py-3 text-sm text-gray-500 hover:text-[#0D9488] transition-colors">
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
              <p className="text-xs text-red-600">{errors.document.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Dataset{' '}
              <span className="text-xs text-gray-400 font-normal">(optional)</span>
            </label>
            <label className="cursor-pointer inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-gray-200 hover:border-[#0D9488] hover:bg-teal-50/30 px-4 py-3 text-sm text-gray-500 hover:text-[#0D9488] transition-colors">
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
          <SecondaryButton
            type="submit"
            onClick={() => setSubmitMode('draft')}
            disabled={createMutation.isLoading}
            className="flex-1"
          >
            {createMutation.isLoading && submitMode === 'draft' ? 'Saving…' : 'Save as Draft'}
          </SecondaryButton>
          <PrimaryButton
            type="submit"
            onClick={() => setSubmitMode('submit')}
            disabled={createMutation.isLoading}
            loading={createMutation.isLoading && submitMode === 'submit'}
            className="flex-1"
          >
            {createMutation.isLoading && submitMode === 'submit' ? 'Submitting…' : 'Submit for Review'}
          </PrimaryButton>
        </div>

        {createMutation.isError && (
          <FormError message="Something went wrong. Please try again." />
        )}
      </form>
    </div>
  )
}
