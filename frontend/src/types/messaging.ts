export type ConvType = 'user_admin' | 'peer' | 'mentorship' | 'research_collab'

export interface NotificationItem {
  id: string
  channel: 'email' | 'sms' | 'in_app'
  subject: string
  body: string
  status: 'pending' | 'sent' | 'failed'
  is_read: boolean
  sent_at: string | null
  created_at: string
}

export interface ConversationParticipant {
  id: string
  full_name: string
  email: string
  role: string
  avatar?: string | null
}

export interface LastMessage {
  text: string
  sender_id: string
  created_at: string
}

export interface Conversation {
  id: string
  conv_type: ConvType
  conv_type_display: string
  subject: string
  participants: ConversationParticipant[]
  last_message: LastMessage | null
  unread_count: number
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation: string
  sender_id: string
  sender_name: string
  text: string
  is_read: boolean
  created_at: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'bot'
  text: string
  timestamp: Date
}

export interface UserSearchResult {
  id: string
  full_name: string
  email: string
  role: string
  avatar?: string | null
}
