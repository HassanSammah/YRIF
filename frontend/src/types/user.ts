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

export interface Profile {
  bio: string
  phone: string
  institution: string
  skills: string
  research_interests: string
  avatar: string | null
  region: string
}

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: UserRole
  is_approved: boolean
  created_at: string
  profile: Profile | null
}
