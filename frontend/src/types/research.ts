export type ResearchCategory = 'natural_sciences' | 'social_sciences' | 'arts' | 'technology'
export type ResearchStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'published'

export const RESEARCH_CATEGORY_LABELS: Record<ResearchCategory, string> = {
  natural_sciences: 'Natural Sciences',
  social_sciences: 'Social Sciences',
  arts: 'Arts & Humanities',
  technology: 'Technology & Engineering',
}

export const RESEARCH_STATUS_LABELS: Record<ResearchStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  published: 'Published',
}

export interface ResearchReview {
  id: string
  reviewer: string
  reviewer_name: string
  comments: string
  decision: 'approve' | 'reject' | 'revise'
  created_at: string
}

export interface ReviewAssignment {
  id: string
  reviewer: string
  reviewer_name: string
  assigned_by: string
  assigned_by_name: string
  state: 'assigned' | 'completed'
  created_at: string
}

export interface Research {
  id: string
  title: string
  abstract: string
  category: ResearchCategory
  status: ResearchStatus
  author: string
  author_name: string
  author_email?: string
  document: string
  dataset: string | null
  keywords: string
  views_count: number
  downloads_count: number
  rejection_reason?: string
  published_at: string | null
  created_at: string
  reviews?: ResearchReview[]
  assignments?: ReviewAssignment[]
}
