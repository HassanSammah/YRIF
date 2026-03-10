export type ResourceType = 'guide' | 'template' | 'dataset' | 'webinar' | 'recording' | 'other'

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  guide: 'Guide',
  template: 'Template',
  dataset: 'Dataset',
  webinar: 'Webinar',
  recording: 'Recording',
  other: 'Other',
}

export interface Resource {
  id: string
  title: string
  description: string
  resource_type: ResourceType
  file: string | null
  file_url: string | null
  external_url: string
  tags: string[]
  is_published: boolean
  views_count: number
  downloads_count: number
  created_by: string | null
  created_by_name: string | null
  created_at: string
  updated_at: string
}

export interface Webinar {
  id: string
  title: string
  description: string
  scheduled_at: string
  registration_link: string
  recording_url: string
  tags: string[]
  is_published: boolean
  views_count: number
  is_past: boolean
  created_by: string | null
  created_by_name: string | null
  created_at: string
  updated_at: string
}

export interface ResourceWriteData {
  title: string
  description?: string
  resource_type: ResourceType
  external_url?: string
  tags?: string[]
  is_published?: boolean
}

export interface WebinarWriteData {
  title: string
  description?: string
  scheduled_at: string
  registration_link?: string
  recording_url?: string
  tags?: string[]
  is_published?: boolean
}
