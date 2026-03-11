import apiClient from './client'
import type { PaginatedResponse } from '@/types/api'
import type {
  DashboardStats,
  AuditLogEntry,
  ReportExportRecord,
  Announcement,
  NewsPost,
  ContactInquiry,
  ExportParams,
} from '@/types/admin'

export const adminApi = {
  // ── Dashboard ─────────────────────────────────────────────────────────────
  getDashboardStats: () =>
    apiClient.get<DashboardStats>('/admin/dashboard/'),

  // ── Reports / Export ──────────────────────────────────────────────────────
  exportReport: (params: ExportParams) =>
    apiClient.get('/admin/reports/export/', { params, responseType: 'blob' }),

  listExportHistory: () =>
    apiClient.get<ReportExportRecord[]>('/admin/reports/history/'),

  // ── Audit log ─────────────────────────────────────────────────────────────
  listAuditLog: (params?: { action?: string; target_type?: string; search?: string; page?: number }) =>
    apiClient.get<PaginatedResponse<AuditLogEntry>>('/admin/audit-log/', { params }),

  // ── Public content ────────────────────────────────────────────────────────
  listPublicAnnouncements: () =>
    apiClient.get<PaginatedResponse<Announcement>>('/admin/announcements/public/'),

  listPublicNews: (params?: { search?: string }) =>
    apiClient.get<PaginatedResponse<NewsPost>>('/admin/news/public/', { params }),

  // ── Admin: Announcements ──────────────────────────────────────────────────
  listAnnouncements: (params?: { is_published?: boolean; search?: string; page?: number }) =>
    apiClient.get<PaginatedResponse<Announcement>>('/admin/announcements/', { params }),

  createAnnouncement: (data: { title: string; content: string; is_published?: boolean }) =>
    apiClient.post<Announcement>('/admin/announcements/', data),

  updateAnnouncement: (id: string, data: Partial<{ title: string; content: string; is_published: boolean }>) =>
    apiClient.patch<Announcement>(`/admin/announcements/${id}/`, data),

  deleteAnnouncement: (id: string) =>
    apiClient.delete(`/admin/announcements/${id}/`),

  // ── Admin: News/Blog ──────────────────────────────────────────────────────
  listNews: (params?: { is_published?: boolean; search?: string; page?: number }) =>
    apiClient.get<PaginatedResponse<NewsPost>>('/admin/news/', { params }),

  createNews: (data: { title: string; slug: string; body: string; is_published?: boolean }) =>
    apiClient.post<NewsPost>('/admin/news/', data),

  updateNews: (slug: string, data: Partial<{ title: string; body: string; is_published: boolean }>) =>
    apiClient.patch<NewsPost>(`/admin/news/${slug}/`, data),

  deleteNews: (slug: string) =>
    apiClient.delete(`/admin/news/${slug}/`),

  // ── Admin: Contact Inquiries ──────────────────────────────────────────────
  listContacts: (params?: { is_resolved?: boolean; search?: string; page?: number }) =>
    apiClient.get<PaginatedResponse<ContactInquiry>>('/admin/contacts/', { params }),

  resolveContact: (id: string) =>
    apiClient.patch<ContactInquiry>(`/admin/contacts/${id}/resolve/`),
}
