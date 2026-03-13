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

export type UserStatus = 'pending_approval' | 'active' | 'suspended' | 'rejected' | 'pending_email'

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  pending_approval: 'Pending Approval',
  active: 'Active',
  suspended: 'Suspended',
  rejected: 'Rejected',
  pending_email: 'Pending Email Verification',
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
  email_verified?: boolean
  created_at: string
  profile: Profile | null
  mentor_profile: MentorProfile | null
  partner_profile: PartnerProfile | null
  ra_profile: ResearchAssistantProfile | null
}

export const EDUCATION_LEVELS = [
  { value: '', label: 'Select education level' },
  { value: 'secondary_form1', label: 'Secondary – Form 1', group: 'Secondary' },
  { value: 'secondary_form2', label: 'Secondary – Form 2', group: 'Secondary' },
  { value: 'secondary_form3', label: 'Secondary – Form 3', group: 'Secondary' },
  { value: 'secondary_form4', label: 'Secondary – Form 4', group: 'Secondary' },
  { value: 'secondary_form5', label: 'Secondary – Form 5', group: 'Secondary' },
  { value: 'secondary_form6', label: 'Secondary – Form 6', group: 'Secondary' },
  { value: 'uni_certificate', label: 'Certificate', group: 'University' },
  { value: 'uni_diploma', label: 'Diploma', group: 'University' },
  { value: 'uni_bachelor', label: "Bachelor's Degree", group: 'University' },
  { value: 'uni_master', label: "Master's Degree", group: 'University' },
  { value: 'uni_phd', label: 'PhD', group: 'University' },
  { value: 'uni_postdoc', label: 'Postdoctoral', group: 'University' },
  { value: 'other', label: 'Other' },
]
