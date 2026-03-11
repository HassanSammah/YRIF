export interface DashboardStats {
  users: {
    total: number
    by_status: Record<string, number>
    by_role: Record<string, number>
    new_last_30d: number
    new_last_7d: number
  }
  research: {
    total: number
    by_status: Record<string, number>
    total_views: number
    total_downloads: number
    new_last_30d: number
  }
  events: {
    total: number
    published: number
    upcoming: number
    total_registrations: number
  }
  mentorship: {
    total_requests: number
    pending_requests: number
    active_matches: number
    completed_matches: number
  }
  resources: {
    total: number
    webinars: number
    total_views: number
    total_downloads: number
  }
  content: {
    announcements: number
    news_posts: number
    open_contacts: number
  }
  recent_activity: AuditLogEntry[]
}

export interface AuditLogEntry {
  id: string
  actor: string | null
  actor_name: string | null
  actor_email: string | null
  action: string
  target_type: string
  target_id: string | null
  target_repr: string
  details: Record<string, unknown>
  created_at: string
}

export interface ReportExportRecord {
  id: string
  report_type: string
  filters: Record<string, string>
  row_count: number
  generated_by: string | null
  generated_by_name: string | null
  created_at: string
}

export interface Announcement {
  id: string
  title: string
  content: string
  is_published: boolean
  author: string | null
  author_name: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface NewsPost {
  id: string
  title: string
  slug: string
  body: string
  cover_image: string | null
  is_published: boolean
  author: string | null
  author_name: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface ContactInquiry {
  id: string
  name: string
  email: string
  subject: string
  message: string
  is_resolved: boolean
  created_at: string
}

export type ReportType = 'members' | 'research' | 'events' | 'mentorship'

export interface ExportParams {
  type: ReportType
  date_from?: string
  date_to?: string
  role?: string
  status?: string
}
