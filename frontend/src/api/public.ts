import apiClient from './client'
import type { PaginatedResponse } from '@/types/api'
import type { Event } from '@/types/events'
import type { Research } from '@/types/research'
import type { Announcement, NewsPost } from '@/types/admin'
import type { PartnerListing } from '@/types/mentorship'

export interface PublicStats {
  total_members: number
  research_projects: number
  events_hosted: number
  partner_organizations: number
}

export interface Vacancy {
  id: string
  title: string
  type: 'full_time' | 'part_time' | 'contract' | 'internship'
  location: string
  deadline: string
  description: string
}

export interface DonationPayload {
  name: string
  email: string
  amount: number
  recurring: boolean
}

/** Public (unauthenticated) API calls used by the landing page and public pages. */
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

  getStats: () =>
    apiClient.get<PublicStats>('/public/stats/'),

  getVacancies: () =>
    apiClient.get<Vacancy[]>('/public/vacancies/'),

  submitDonation: (data: DonationPayload) =>
    apiClient.post('/public/donations/', data),
}
