export type ResearchCategory = 'natural_sciences' | 'social_sciences' | 'arts' | 'technology'
export type ResearchStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected'

export interface Research {
  id: string
  title: string
  abstract: string
  category: ResearchCategory
  status: ResearchStatus
  author: string
  author_name: string
  document: string
  dataset: string | null
  keywords: string
  views_count: number
  downloads_count: number
  published_at: string | null
  created_at: string
}

export interface ResearchReview {
  id: string
  comments: string
  decision: 'approve' | 'reject' | 'revise'
  created_at: string
}
