import { useState, useRef, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import {
  MessageCircle, Send, Plus, Search, Loader2, ChevronLeft,
  Users, Handshake, BookOpen, MessageSquare, X,
} from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'
import { communicationsApi } from '@/api/communications'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import type { Conversation, Message, ConvType, UserSearchResult } from '@/types/messaging'
import { usePageTitle } from '@/hooks/usePageTitle'

// ── Constants ─────────────────────────────────────────────────────────────────

const CONV_TYPE_CONFIG: Record<ConvType, {
  label: string
  color: string
  icon: React.ComponentType<{ className?: string }>
}> = {
  user_admin:      { label: 'Support',    color: 'bg-gray-100 text-gray-600',   icon: Users },
  peer:            { label: 'Peer',       color: 'bg-blue-50 text-blue-700',    icon: MessageSquare },
  mentorship:      { label: 'Mentorship', color: 'bg-teal-50 text-[#0D9488]',   icon: Handshake },
  research_collab: { label: 'Research',   color: 'bg-purple-50 text-purple-700',icon: BookOpen },
}

const ROLE_LABEL: Record<string, string> = {
  mentor: 'Mentor', youth: 'Youth', researcher: 'Researcher',
  research_assistant: 'Research Asst.', industry_partner: 'Partner',
  admin: 'Admin', staff: 'Staff', program_manager: 'PM',
  content_manager: 'Content', judge: 'Judge',
}

type FilterKey = ConvType | 'all'
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',             label: 'All' },
  { key: 'mentorship',      label: 'Mentorship' },
  { key: 'research_collab', label: 'Research' },
  { key: 'peer',            label: 'Peer' },
  { key: 'user_admin',      label: 'Support' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function msgTime(dateStr: string) {
  const d = new Date(dateStr)
  if (isToday(d))     return format(d, 'HH:mm')
  if (isYesterday(d)) return `Yesterday ${format(d, 'HH:mm')}`
  return format(d, 'MMM d, HH:mm')
}

function AvatarCircle({ name, size = 'w-9 h-9' }: { name: string; size?: string }) {
  return (
    <div className={`${size} rounded-full bg-gradient-to-br from-teal-400 to-[#093344] flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

// ── ConvBadge ─────────────────────────────────────────────────────────────────

function ConvBadge({ type }: { type: ConvType }) {
  const cfg = CONV_TYPE_CONFIG[type] ?? CONV_TYPE_CONFIG.user_admin
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.color}`}>
      <Icon className="w-2.5 h-2.5" />
      {cfg.label}
    </span>
  )
}

// ── ConversationItem ──────────────────────────────────────────────────────────

function ConversationItem({ conv, isActive, onClick }: {
  conv: Conversation; isActive: boolean; onClick: () => void
}) {
  const { user } = useAuth()
  const others = conv.participants.filter(p => p.id !== String(user?.id))
  const displayName = others.length > 0 ? others.map(p => p.full_name).join(', ') : conv.subject || 'Support'

  return (
    <button onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors border-l-4 ${
        isActive ? 'bg-teal-50 border-l-[#0D9488]' : 'border-l-transparent'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <AvatarCircle name={displayName} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-xs font-semibold text-gray-900 truncate mr-1">{displayName}</span>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {conv.unread_count > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#0D9488] text-white text-[10px] font-bold flex items-center justify-center">
                  {conv.unread_count > 9 ? '9+' : conv.unread_count}
                </span>
              )}
              {conv.last_message && (
                <span className="text-[10px] text-gray-400">{msgTime(conv.last_message.created_at)}</span>
              )}
            </div>
          </div>
          <ConvBadge type={conv.conv_type} />
          {conv.last_message
            ? <p className="text-[11px] text-gray-400 truncate mt-0.5">{conv.last_message.text}</p>
            : <p className="text-[11px] text-gray-300 italic mt-0.5">{conv.subject || 'No messages yet'}</p>
          }
        </div>
      </div>
    </button>
  )
}

// ── ConversationList ──────────────────────────────────────────────────────────

function ConversationList({ selected, onSelect, onNew }: {
  selected: string | null
  onSelect: (id: string) => void
  onNew: () => void
}) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterKey>('all')

  const { data, isLoading } = useQuery(
    'conversations',
    () => communicationsApi.listConversations().then(r => r.data),
    { refetchInterval: 15_000 },
  )

  const convs = (data?.results ?? []).filter(c => {
    if (filter !== 'all' && c.conv_type !== filter) return false
    const q = search.toLowerCase()
    if (!q) return true
    return (
      c.subject?.toLowerCase().includes(q) ||
      c.participants.some(p => p.full_name.toLowerCase().includes(q))
    )
  })

  return (
    <div className="flex flex-col h-full border-r border-gray-100">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-900">Messages</h2>
          <button onClick={onNew} className="p-1.5 rounded-lg bg-[#093344] text-white hover:bg-[#0D9488] transition-colors" title="New conversation">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations…"
            className="w-full rounded-xl border border-gray-200 bg-white pl-8 pr-3 py-1.5 text-xs placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488]"
          />
        </div>
        {/* Filter pills */}
        <div className="flex gap-1 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
                filter === f.key ? 'bg-[#093344] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading
          ? <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gray-300" /></div>
          : convs.length === 0
            ? <div className="text-center py-8 px-4"><MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-200" /><p className="text-xs text-gray-400">No conversations yet.</p></div>
            : convs.map(conv => (
              <ConversationItem key={conv.id} conv={conv} isActive={conv.id === selected} onClick={() => onSelect(conv.id)} />
            ))
        }
      </div>
    </div>
  )
}

// ── MessageBubble ─────────────────────────────────────────────────────────────

function MessageBubble({ msg, isOwn, showSender }: { msg: Message; isOwn: boolean; showSender: boolean }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] flex flex-col gap-0.5 ${isOwn ? 'items-end' : 'items-start'}`}>
        {showSender && !isOwn && (
          <span className="text-[11px] text-gray-400 px-1">{msg.sender_name}</span>
        )}
        <div className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
          isOwn
            ? 'bg-[#093344] text-white rounded-br-md'
            : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-md'
        }`}>
          {msg.text}
        </div>
        <span className="text-[10px] text-gray-300 px-1">{msgTime(msg.created_at)}</span>
      </div>
    </div>
  )
}

// ── ChatThread ────────────────────────────────────────────────────────────────

function ChatThread({ conv, onBack }: { conv: Conversation; onBack: () => void }) {
  const { user } = useAuth()
  const qc = useQueryClient()
  const bottomRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [connected, setConnected] = useState(false)

  // Fetch messages whenever conversation changes
  useEffect(() => {
    setLoading(true)
    setText('')
    communicationsApi.listMessages(conv.id).then(r => {
      const raw = r.data as { results?: Message[] } | Message[]
      setMessages(Array.isArray(raw) ? raw : (raw.results ?? []))
    }).finally(() => setLoading(false))
  }, [conv.id])

  // Supabase Realtime — subscribe per conversation
  useEffect(() => {
    if (!import.meta.env.VITE_SUPABASE_URL) return

    const channel = supabase
      .channel(`conv:${conv.id}`)
      .on('broadcast', { event: 'new_message' }, ({ payload }) => {
        const msg = payload as Message
        // Only add messages from other participants (own messages added optimistically)
        if (String(msg.sender_id) !== String(user?.id)) {
          setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
          qc.invalidateQueries('conversations')
        }
      })
      .subscribe(s => setConnected(s === 'SUBSCRIBED'))

    channelRef.current = channel
    return () => { channel.unsubscribe(); setConnected(false) }
  }, [conv.id, user?.id, qc])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const sendMutation = useMutation(
    (txt: string) => communicationsApi.sendMessage(conv.id, txt),
    {
      onMutate: async (txt) => {
        const optimistic: Message = {
          id: `opt_${Date.now()}`,
          conversation: conv.id,
          sender_id: String(user?.id ?? ''),
          sender_name: user
            ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.email
            : 'You',
          text: txt,
          is_read: false,
          created_at: new Date().toISOString(),
        }
        setMessages(prev => [...prev, optimistic])
        return { optimisticId: optimistic.id }
      },
      onSuccess: (res, _, ctx) => {
        const saved = res.data
        // Replace optimistic with real message from server
        setMessages(prev => prev.map(m => m.id === ctx?.optimisticId ? saved : m))
        // Broadcast to other participants via Supabase
        channelRef.current?.send({ type: 'broadcast', event: 'new_message', payload: saved })
        qc.invalidateQueries('conversations')
        setText('')
      },
      onError: (_, __, ctx) => {
        setMessages(prev => prev.filter(m => m.id !== ctx?.optimisticId))
      },
    },
  )

  const others = conv.participants.filter(p => p.id !== String(user?.id))
  const displayName = others.length > 0 ? others.map(p => p.full_name).join(', ') : 'Support'
  const isGroupConv = conv.participants.length > 2

  const handleSend = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed || sendMutation.isLoading) return
    sendMutation.mutate(trimmed)
  }, [text, sendMutation])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white">
        <button onClick={onBack} className="md:hidden p-1 rounded-lg hover:bg-gray-100">
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        </button>
        <AvatarCircle name={displayName} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
            <ConvBadge type={conv.conv_type} />
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {others.map((p, i) => (
              <span key={p.id} className="text-[11px] text-gray-400">
                {p.full_name}{p.role ? ` (${ROLE_LABEL[p.role] ?? p.role})` : ''}
                {i < others.length - 1 ? ' ·' : ''}
              </span>
            ))}
            {conv.subject && <span className="text-[11px] text-gray-400 italic truncate">— {conv.subject}</span>}
          </div>
        </div>
        {/* Live indicator */}
        <div
          className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${connected ? 'bg-green-400' : 'bg-gray-300'}`}
          title={connected ? 'Live' : 'Connecting…'}
        />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-gray-50">
        {loading
          ? <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gray-300" /></div>
          : messages.length === 0
            ? <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageCircle className="w-10 h-10 text-gray-200 mb-2" />
                <p className="text-xs text-gray-400">No messages yet — say hello! 👋</p>
              </div>
            : messages.map((msg, i) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isOwn={String(msg.sender_id) === String(user?.id)}
                showSender={isGroupConv && (i === 0 || messages[i - 1].sender_id !== msg.sender_id)}
              />
            ))
        }
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-100 bg-white">
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
            rows={1}
            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] max-h-32 overflow-y-auto"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sendMutation.isLoading}
            className="rounded-xl bg-[#093344] hover:bg-[#0D9488] p-2.5 text-white transition-colors disabled:opacity-50 flex-shrink-0"
          >
            {sendMutation.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── NewConversationModal ──────────────────────────────────────────────────────

type NewConvMode = 'user_admin' | 'peer' | 'mentorship' | 'research_collab'

const MODE_OPTIONS: {
  key: NewConvMode
  label: string
  desc: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  { key: 'peer',            label: 'Peer Message',    desc: 'Message any user',        icon: MessageSquare },
  { key: 'mentorship',      label: 'Mentorship',      desc: 'Mentor ↔ Mentee session', icon: Handshake },
  { key: 'research_collab', label: 'Research Collab', desc: 'Researcher ↔ Assistant',  icon: BookOpen },
  { key: 'user_admin',      label: 'Support',         desc: 'Contact YRIF team',       icon: Users },
]

function UserPicker({ roleHint, onPick }: { roleHint?: string; onPick: (u: UserSearchResult) => void }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<UserSearchResult[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (q.length < 2) { setResults([]); return }
    const t = setTimeout(() => {
      setBusy(true)
      communicationsApi.searchUsers(q, roleHint)
        .then(r => setResults(r.data))
        .finally(() => setBusy(false))
    }, 300)
    return () => clearTimeout(t)
  }, [q, roleHint])

  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">Search user</label>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Name or email…"
          className="w-full rounded-xl border border-gray-200 bg-white pl-8 pr-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] transition-all duration-150"
        />
        {busy && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-gray-400" />}
      </div>
      {results.length > 0 && (
        <div className="mt-1 rounded-xl border border-gray-100 shadow-sm bg-white max-h-40 overflow-y-auto">
          {results.map(u => (
            <button key={u.id} onClick={() => { onPick(u); setQ(''); setResults([]) }}
              className="w-full text-left px-3 py-2 hover:bg-teal-50 flex items-center gap-2 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-400 to-[#093344] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {u.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-900">{u.full_name}</p>
                <p className="text-[10px] text-gray-400">{ROLE_LABEL[u.role] ?? u.role}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function NewConversationModal({ onClose, onCreate }: {
  onClose: () => void
  onCreate: (id: string) => void
}) {
  const qc = useQueryClient()
  const [mode, setMode] = useState<NewConvMode>('peer')
  const [subject, setSubject] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null)

  const mutation = useMutation(
    async () => {
      if (mode === 'user_admin') {
        return communicationsApi.createConversation({ subject: subject || 'Support Request', conv_type: 'user_admin' })
      }
      if (!selectedUser) throw new Error('No user selected')
      if (mode === 'peer')            return communicationsApi.startPeerConversation(selectedUser.id, subject)
      if (mode === 'mentorship')      return communicationsApi.startPeerConversation(selectedUser.id, subject, 'mentorship')
      if (mode === 'research_collab') return communicationsApi.startPeerConversation(selectedUser.id, subject, 'research_collab')
      return communicationsApi.startPeerConversation(selectedUser.id, subject)
    },
    {
      onSuccess: res => {
        qc.invalidateQueries('conversations')
        onCreate(res.data.id)
        onClose()
      },
    },
  )

  const needsUser = mode !== 'user_admin'
  const canSubmit = !needsUser || selectedUser !== null
  const roleHint = mode === 'research_collab' ? 'research_assistant' : undefined

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900">New Conversation</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-4 h-4 text-gray-500" /></button>
        </div>

        {/* Mode selector */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {MODE_OPTIONS.map(opt => {
            const Icon = opt.icon
            const active = mode === opt.key
            return (
              <button key={opt.key} onClick={() => { setMode(opt.key); setSelectedUser(null) }}
                className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-center transition-colors ${
                  active ? 'border-[#0D9488] bg-teal-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-[#0D9488]' : 'text-gray-400'}`} />
                <span className={`text-xs font-semibold leading-tight ${active ? 'text-[#093344]' : 'text-gray-600'}`}>{opt.label}</span>
                <span className="text-[10px] text-gray-400 leading-tight">{opt.desc}</span>
              </button>
            )
          })}
        </div>

        {/* User picker */}
        {needsUser && (
          <div className="mb-4">
            {selectedUser ? (
              <div className="flex items-center gap-2 rounded-xl border-2 border-[#0D9488] bg-teal-50 p-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-[#093344] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {selectedUser.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 truncate">{selectedUser.full_name}</p>
                  <p className="text-[10px] text-gray-500">{ROLE_LABEL[selectedUser.role] ?? selectedUser.role}</p>
                </div>
                <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <UserPicker roleHint={roleHint} onPick={setSelectedUser} />
            )}
          </div>
        )}

        {/* Subject */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            {mode === 'mentorship' ? 'Topic / Session Goal' : 'Subject'}{' '}
            <span className="text-gray-400">(optional)</span>
          </label>
          <input value={subject} onChange={e => setSubject(e.target.value)}
            placeholder={
              mode === 'mentorship'      ? 'e.g. Career guidance in data science' :
              mode === 'research_collab' ? 'e.g. Literature review collaboration' :
              mode === 'user_admin'      ? 'e.g. Question about my application'  :
              "e.g. Let's connect!"
            }
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] transition-all duration-150"
          />
        </div>

        {mode === 'user_admin' && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl mb-4">
            <Users className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <p className="text-xs text-blue-700">Your message will be sent to the YRIF support team.</p>
          </div>
        )}

        {mutation.isError && <p className="text-xs text-red-600 mb-3">Something went wrong. Please try again.</p>}

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 bg-white text-gray-700 hover:border-[#0D9488] hover:text-[#0D9488] px-4 py-2.5 text-sm font-semibold transition-colors">
            Cancel
          </button>
          <button onClick={() => mutation.mutate()} disabled={!canSubmit || mutation.isLoading}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#093344] hover:bg-[#0D9488] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all disabled:opacity-50"
          >
            {mutation.isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Start
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Messages() {
  usePageTitle('Messages')
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)

  const { data } = useQuery(
    'conversations',
    () => communicationsApi.listConversations().then(r => r.data),
    { refetchInterval: 15_000 },
  )

  const selectedConv = (data?.results ?? []).find(c => c.id === selectedConvId) ?? null

  return (
    <div className="max-w-5xl mx-auto px-0 md:px-4 py-0 md:py-8 h-[calc(100vh-4rem)]">
      <div className="bg-white rounded-none md:rounded-2xl border-0 md:border border-gray-100 shadow-none md:shadow-sm h-full flex overflow-hidden">
        {/* Sidebar */}
        <div className={`w-full md:w-72 flex-shrink-0 ${selectedConvId ? 'hidden md:flex' : 'flex'} flex-col`}>
          <ConversationList selected={selectedConvId} onSelect={setSelectedConvId} onNew={() => setShowNew(true)} />
        </div>

        {/* Chat area */}
        <div className={`flex-1 ${!selectedConvId ? 'hidden md:flex' : 'flex'} flex-col`}>
          {selectedConv ? (
            <ChatThread conv={selectedConv} onBack={() => setSelectedConvId(null)} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <MessageCircle className="w-12 h-12 text-gray-200 mb-3" />
              <p className="text-sm font-medium text-gray-500">Select a conversation</p>
              <p className="text-xs text-gray-400 mt-1">or start a new one</p>
              <button onClick={() => setShowNew(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#093344] hover:bg-[#0D9488] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" /> New conversation
              </button>
            </div>
          )}
        </div>
      </div>

      {showNew && (
        <NewConversationModal onClose={() => setShowNew(false)} onCreate={id => setSelectedConvId(id)} />
      )}
    </div>
  )
}
