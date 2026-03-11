import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { MessageCircle, Send, Plus, Search, Loader2, Users, ChevronLeft } from 'lucide-react'
import { communicationsApi } from '@/api/communications'
import { useAuth } from '@/hooks/useAuth'
import type { Conversation, Message } from '@/types/messaging'

// ── Conversation List ─────────────────────────────────────────────────────────

function ConversationList({
  selected,
  onSelect,
  onNew,
}: {
  selected: string | null
  onSelect: (id: string) => void
  onNew: () => void
}) {
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery(
    'conversations',
    () => communicationsApi.listConversations().then((r) => r.data),
    { refetchInterval: 5000 },
  )

  const convs = (data?.results ?? []).filter((c) =>
    c.subject.toLowerCase().includes(search.toLowerCase()) ||
    c.participants.some((p) => p.full_name.toLowerCase().includes(search.toLowerCase())),
  )

  return (
    <div className="flex flex-col h-full border-r border-gray-100">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-900">Messages</h2>
          <button
            onClick={onNew}
            className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
            title="New conversation"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="w-full rounded-lg border border-gray-200 pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
          </div>
        ) : convs.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-400">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-200" />
            No conversations yet.
          </div>
        ) : (
          convs.map((conv) => (
            <ConversationItem
              key={conv.id}
              conv={conv}
              isActive={conv.id === selected}
              onClick={() => onSelect(conv.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function ConversationItem({
  conv,
  isActive,
  onClick,
}: {
  conv: Conversation
  isActive: boolean
  onClick: () => void
}) {
  const { user } = useAuth()
  const others = conv.participants.filter((p) => p.id !== user?.id)
  const displayName = others.length > 0 ? others.map((p) => p.full_name).join(', ') : conv.subject || 'Support'

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
        isActive ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
      }`}
    >
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-900 truncate">{displayName}</span>
            {conv.unread_count > 0 && (
              <span className="ml-1 flex-shrink-0 w-4 h-4 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">
                {conv.unread_count}
              </span>
            )}
          </div>
          {conv.last_message ? (
            <p className="text-xs text-gray-400 truncate mt-0.5">{conv.last_message.text}</p>
          ) : (
            <p className="text-xs text-gray-300 italic mt-0.5">{conv.subject || 'No messages yet'}</p>
          )}
        </div>
      </div>
    </button>
  )
}

// ── Chat Thread ───────────────────────────────────────────────────────────────

function ChatThread({
  conv,
  onBack,
}: {
  conv: Conversation
  onBack: () => void
}) {
  const { user } = useAuth()
  const qc = useQueryClient()
  const bottomRef = useRef<HTMLDivElement>(null)
  const [text, setText] = useState('')

  const { data, isLoading } = useQuery(
    ['messages', conv.id],
    () => communicationsApi.listMessages(conv.id).then((r) => r.data),
    { refetchInterval: 3000 },
  )

  const messages: Message[] = data?.results ?? []

  const sendMutation = useMutation(
    (txt: string) => communicationsApi.sendMessage(conv.id, txt),
    {
      onSuccess: () => {
        qc.invalidateQueries(['messages', conv.id])
        qc.invalidateQueries('conversations')
        setText('')
      },
    },
  )

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const others = conv.participants.filter((p) => p.id !== user?.id)
  const displayName = others.length > 0 ? others.map((p) => p.full_name).join(', ') : conv.subject || 'Support'

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed || sendMutation.isLoading) return
    sendMutation.mutate(trimmed)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white">
        <button onClick={onBack} className="md:hidden p-1 rounded-lg hover:bg-gray-100">
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{displayName}</p>
          {conv.subject && <p className="text-xs text-gray-400">{conv.subject}</p>}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-xs text-gray-400 py-8">No messages yet. Say hello!</div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === user?.id
            return (
              <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                  {!isOwn && (
                    <span className="text-xs text-gray-400 px-1">{msg.sender_name}</span>
                  )}
                  <div
                    className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                      isOwn
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-md'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-xs text-gray-300 px-1">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-100 bg-white">
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Type a message… (Enter to send)"
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-32 overflow-y-auto"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sendMutation.isLoading}
            className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 flex-shrink-0"
          >
            {sendMutation.isLoading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// ── New Conversation Modal ────────────────────────────────────────────────────

function NewConversationModal({ onClose, onCreate }: { onClose: () => void; onCreate: (id: string) => void }) {
  const qc = useQueryClient()
  const [subject, setSubject] = useState('')

  const mutation = useMutation(
    () => communicationsApi.createConversation({
      subject: subject || 'Support',
      conv_type: 'user_admin',
    }),
    {
      onSuccess: (res) => {
        qc.invalidateQueries('conversations')
        onCreate(res.data.id)
        onClose()
      },
    },
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 className="text-base font-bold text-gray-900 mb-4">New Conversation</h3>
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">Subject</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Question about my application"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl mb-4">
          <Users className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <p className="text-xs text-blue-700">Your message will be sent to the YRIF support team.</p>
        </div>
        {mutation.isError && (
          <p className="text-xs text-red-600 mb-3">Something went wrong. Please try again.</p>
        )}
        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isLoading}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
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
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)

  const { data } = useQuery(
    'conversations',
    () => communicationsApi.listConversations().then((r) => r.data),
    { refetchInterval: 5000 },
  )

  const selectedConv = (data?.results ?? []).find((c) => c.id === selectedConvId) ?? null

  return (
    <div className="max-w-5xl mx-auto px-0 md:px-4 py-0 md:py-8 h-[calc(100vh-4rem)]">
      <div className="bg-white rounded-none md:rounded-2xl border-0 md:border border-gray-100 shadow-none md:shadow-sm h-full flex overflow-hidden">
        {/* Sidebar — hidden on mobile when chat is open */}
        <div className={`w-full md:w-72 flex-shrink-0 ${selectedConvId ? 'hidden md:flex' : 'flex'} flex-col`}>
          <ConversationList
            selected={selectedConvId}
            onSelect={setSelectedConvId}
            onNew={() => setShowNew(true)}
          />
        </div>

        {/* Main chat area */}
        <div className={`flex-1 ${!selectedConvId ? 'hidden md:flex' : 'flex'} flex-col`}>
          {selectedConv ? (
            <ChatThread conv={selectedConv} onBack={() => setSelectedConvId(null)} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <MessageCircle className="w-12 h-12 text-gray-200 mb-3" />
              <p className="text-sm font-medium text-gray-500">Select a conversation</p>
              <p className="text-xs text-gray-400 mt-1">or start a new one to contact YRIF support</p>
              <button
                onClick={() => setShowNew(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" /> New conversation
              </button>
            </div>
          )}
        </div>
      </div>

      {showNew && (
        <NewConversationModal
          onClose={() => setShowNew(false)}
          onCreate={(id) => setSelectedConvId(id)}
        />
      )}
    </div>
  )
}
