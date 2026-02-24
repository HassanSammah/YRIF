export type EventType = 'event' | 'competition' | 'webinar'

export interface Event {
  id: string
  title: string
  description: string
  event_type: EventType
  start_date: string
  end_date: string
  location: string
  is_online: boolean
  online_link: string
  max_participants: number | null
  is_published: boolean
  created_at: string
}

export interface EventRegistration {
  id: string
  event: string
  participant: string
  research_submission: string | null
  created_at: string
}

export interface Certificate {
  id: string
  position: string
  file: string | null
  issued_at: string
}
