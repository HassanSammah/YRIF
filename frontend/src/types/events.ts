export type EventType = 'seminar' | 'workshop' | 'bonanza' | 'competition' | 'webinar'
export type RegistrationStatus = 'registered' | 'attended' | 'cancelled'
export type CertificateType = 'participant' | 'winner'

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  seminar: 'Seminar',
  workshop: 'Workshop',
  bonanza: 'Bonanza',
  competition: 'Competition',
  webinar: 'Webinar',
}

export interface Event {
  id: string
  title: string
  description: string
  event_type: EventType
  start_date: string
  end_date: string
  registration_deadline: string | null
  location: string
  is_online: boolean
  online_link: string
  max_participants: number | null
  is_published: boolean
  created_by: string | null
  registrations_count: number
  is_registration_open: boolean
  created_at: string
}

export interface JudgeScore {
  id: string
  judge: string
  judge_name: string
  score: number
  comments: string
  created_at: string
}

export interface EventRegistration {
  id: string
  event: string
  event_title: string
  event_type: EventType
  event_start_date: string
  participant: string
  participant_name: string
  participant_email: string
  research_submission: string | null
  status: RegistrationStatus
  scores: JudgeScore[]
  has_certificate: boolean
  created_at: string
}

export interface Winner {
  id: string
  event: string
  registration: string
  rank: string
  participant_name: string
  research_title: string | null
  published_at: string
}

export interface Certificate {
  id: string
  registration_id: string
  event_id: string
  event_title: string
  certificate_type: CertificateType
  position: string
  issued_at: string
}
