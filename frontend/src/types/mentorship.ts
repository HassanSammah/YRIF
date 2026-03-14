export type MentorshipRequestStatus = 'pending' | 'approved' | 'matched' | 'declined' | 'closed'
export type MentorshipMatchStatus = 'active' | 'completed' | 'cancelled'

export const MENTORSHIP_REQUEST_STATUS_LABELS: Record<MentorshipRequestStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  matched: 'Matched',
  declined: 'Declined',
  closed: 'Closed',
}

export const MENTORSHIP_MATCH_STATUS_LABELS: Record<MentorshipMatchStatus, string> = {
  active: 'Active',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export interface MentorListing {
  id: string
  full_name: string
  email: string
  expertise_areas: string
  availability: string
  is_verified: boolean
  bio: string
}

export interface PartnerListing {
  id: string
  full_name: string
  email: string
  org_name: string
  partner_type: 'industry' | 'community'
  sector: string
  contact_person: string
  is_verified: boolean
  bio: string
}

export interface MentorshipRequest {
  id: string
  mentee: string
  mentee_name: string
  mentee_email: string
  mentee_bio: string
  mentee_institution: string
  mentee_phone: string
  mentee_education_level: string
  mentee_skills: string
  mentee_research_interests: string
  preferred_mentor: string | null
  preferred_mentor_name: string | null
  topic: string
  message: string
  status: MentorshipRequestStatus
  created_at: string
}

export interface MentorshipMatch {
  id: string
  request: string | null
  topic: string | null
  mentor: string
  mentor_name: string
  mentor_email: string
  mentee: string
  mentee_name: string
  mentee_email: string
  matched_by: string | null
  matched_by_name: string | null
  start_date: string | null
  end_date: string | null
  status: MentorshipMatchStatus
  notes: string
  created_at: string
}

export interface MentorFeedback {
  id: string
  match: string | null
  given_by: string
  given_by_name: string
  rating: number | null
  feedback_text: string
  created_at: string
}
