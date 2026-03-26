import apiClient from './client'
import type { PaginatedResponse } from '@/types/api'
import type { Event } from '@/types/events'
import type { Research } from '@/types/research'
import type { Announcement, NewsPost } from '@/types/admin'
import type { PartnerListing } from '@/types/mentorship'

/** Public (unauthenticated) API calls used by the landing page. */
export const publicApi = {
  getEvents: (limit = 3) =>
    apiClient.get<PaginatedResponse<Event>>('/events/', { params: { limit } }),

  getAnnouncements: () =>
    apiClient.get<PaginatedResponse<Announcement>>('/admin/announcements/public/'),

  getNews: (limit = 3) =>
    apiClient.get<PaginatedResponse<NewsPost>>('/admin/news/public/', { params: { limit } }),

  getPartners: () =>
    apiClient.get<PaginatedResponse<PartnerListing>>('/mentorship/partners/'),

  getFeaturedResearch: (limit = 3) =>
    apiClient.get<PaginatedResponse<Research>>('/research/', { params: { status: 'published', limit } }),
}
