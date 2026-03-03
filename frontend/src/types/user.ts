export type UserRole =
  | 'youth'
  | 'researcher'
  | 'mentor'
  | 'research_assistant'
  | 'industry_partner'
  | 'admin'
  | 'staff'
  | 'program_manager'
  | 'content_manager'
  | 'judge'

export type UserStatus = 'pending_approval' | 'active' | 'suspended' | 'rejected'

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  pending_approval: 'Pending Approval',
  active: 'Active',
  suspended: 'Suspended',
  rejected: 'Rejected',
}

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  youth: 'Youth / Student',
  researcher: 'Young Researcher',
  mentor: 'Mentor',
  research_assistant: 'Research Assistant',
  industry_partner: 'Industry / Community Partner',
  admin: 'Admin',
  staff: 'YRIF Staff',
  program_manager: 'Program Manager',
  content_manager: 'Content Manager',
  judge: 'Judge',
}

export interface Profile {
  id: string
  bio: string
  phone: string
  phone_verified: boolean
  institution: string
  education_level: string
  region: string
  skills: string
  research_interests: string
  achievements: string
  avatar: string | null
}

export interface MentorProfile {
  id: string
  expertise_areas: string
  availability: string
  is_verified: boolean
}

export interface PartnerProfile {
  id: string
  org_name: string
  partner_type: 'industry' | 'community'
  sector: string
  contact_person: string
  is_verified: boolean
}

export interface ResearchAssistantProfile {
  id: string
  skills: string
  availability: string
  portfolio: string
}

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: UserRole
  status: UserStatus
  is_approved: boolean
  created_at: string
  profile: Profile | null
  mentor_profile: MentorProfile | null
  partner_profile: PartnerProfile | null
  ra_profile: ResearchAssistantProfile | null
}
