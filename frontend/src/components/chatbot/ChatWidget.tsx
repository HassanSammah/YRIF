import { useState, useRef, useEffect, useMemo } from 'react'
import { MessageCircle, X, Send, Loader2, Bot } from 'lucide-react'
import { communicationsApi } from '@/api/communications'
import { useAuth } from '@/hooks/useAuth'
import type { ChatMessage } from '@/types/messaging'

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

/** Render basic markdown (bold, headers, lists, links) as JSX */
function renderMarkdown(text: string) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Headers: ## or ###
    const headerMatch = line.match(/^(#{1,3})\s+(.+)$/)
    if (headerMatch) {
      const level = headerMatch[1].length
      const content = inlineFormat(headerMatch[2])
      elements.push(
        <p key={i} className={`${level === 1 ? 'text-sm' : 'text-[13px]'} font-bold text-gray-900 mt-2 mb-0.5`}>
          {content}
        </p>
      )
      continue
    }

    // Bullet list items: - or •
    // const bulletMatch = line.match(/^[\-•✅❌📧🎯]\s+(.+)$/
    // const bulletMatch = line.match(/^[\-•✅❌📧🎯]\s+(.+)$/)
    // if (bulletMatch) {
    //   elements.push(
    //     <div key={i} className="flex gap-1.5 ml-1">
    //       <span className="text-[#0D9488] mt-px">•</span>
    //       <span>{inlineFormat(bulletMatch[1])}</span>
    //     </div>
    //   )
    //   continue
    // }
    // Bullet list items: -, •, or some common emoji bullets
    const bulletMatch = line.match(/^(-|•|✅|❌|📧|🎯)\s+(.+)$/u)
    if (bulletMatch) {
      elements.push(
        <div key={i} className="flex gap-1.5 ml-1">
          <span className="text-[#0D9488] mt-px">•</span>
          <span>{inlineFormat(bulletMatch[2])}</span>
        </div>
      )
      continue
    }

    // Numbered list: 1. 2. etc.
    const numMatch = line.match(/^(\d+)\.\s+(.+)$/)
    if (numMatch) {
      elements.push(
        <div key={i} className="flex gap-1.5 ml-1">
          <span className="text-[#0D9488] font-medium min-w-[1rem]">{numMatch[1]}.</span>
          <span>{inlineFormat(numMatch[2])}</span>
        </div>
      )
      continue
    }

    // Horizontal rule: ---
    if (/^-{3,}$/.test(line.trim())) {
      elements.push(<hr key={i} className="border-gray-200 my-1.5" />)
      continue
    }

    // Empty line → small spacer
    if (line.trim() === '') {
      elements.push(<div key={i} className="h-1.5" />)
      continue
    }

    // Regular paragraph
    elements.push(<p key={i} className="my-0">{inlineFormat(line)}</p>)
  }

  return <div className="space-y-0.5">{elements}</div>
}

/** Format inline markdown: **bold**, *italic*, `code`, [links](url) */
function inlineFormat(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  // Match **bold**, *italic*, `code`, [text](url), or plain text
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\[(.+?)\]\((.+?)\)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    if (match[1]) parts.push(<strong key={match.index} className="font-semibold text-gray-900">{match[1]}</strong>)
    else if (match[2]) parts.push(<em key={match.index}>{match[2]}</em>)
    else if (match[3]) parts.push(<code key={match.index} className="bg-gray-100 text-[#0D9488] px-1 rounded text-xs">{match[3]}</code>)
    else if (match[4] && match[5]) parts.push(<a key={match.index} href={match[5]} target="_blank" rel="noopener noreferrer" className="text-[#0D9488] underline">{match[4]}</a>)
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts.length === 1 ? parts[0] : <>{parts}</>
}

// Stable chat_id persists for the browser session
const SESSION_KEY = 'yrif_chat_session'
function getSessionId(userId?: string): string {
  const stored = sessionStorage.getItem(SESSION_KEY)
  if (stored) return stored
  const id = userId ? `user_${userId}_${generateId()}` : `anon_${generateId()}`
  sessionStorage.setItem(SESSION_KEY, id)
  return id
}

export default function ChatWidget() {
  const { user } = useAuth()
  const firstName = user?.first_name || user?.email?.split('@')[0] || null

  // Personalised welcome message
  const welcomeMessage = useMemo<ChatMessage>(() => ({
    id: 'welcome',
    role: 'bot',
    text: firstName
      ? `${firstName}, Naomba Tubonge! 👋\n\nMimi ni YRIF Chat, msaidizi wako wa kidijitali. Ninaweza kukusaidia kuhusu utafiti, matukio, ushauri, vyeti, na zaidi. Ungehitaji msaada gani leo?`
      : `Karibu YRIF! 👋 Naomba Tubonge!\n\nMimi ni YRIF Chat, msaidizi wako wa kidijitali. Ninaweza kukusaidia kuhusu utafiti, matukio, ushauri, vyeti, na zaidi. Ungehitaji msaada gani leo?`,
    timestamp: new Date(),
  }), [firstName])

  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Update welcome message if user logs in mid-session
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'welcome') return [welcomeMessage]
      return prev
    })
  }, [welcomeMessage])

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const sessionId = useMemo(
    () => getSessionId(user?.id?.toString()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const send = async (overrideText?: string) => {
    const trimmed = (overrideText ?? input).trim()
    if (!trimmed || loading) return

    const userMsg: ChatMessage = { id: generateId(), role: 'user', text: trimmed, timestamp: new Date() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await communicationsApi.sendChatMessage(trimmed, sessionId)
      const reply = res.data?.reply ?? "Samahani, sikuelewa. Jaribu tena au wasiliana: info@yriftz.org"
      const botMsg: ChatMessage = { id: generateId(), role: 'bot', text: reply, timestamp: new Date() }
      setMessages((prev) => [...prev, botMsg])
    } catch {
      const errMsg: ChatMessage = {
        id: generateId(),
        role: 'bot',
        text: 'Samahani, YRIF Chat haiwezi kuunganika sasa hivi. Tafadhali jaribu tena au wasiliana nasi: info@yriftz.org',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating toggle */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open YRIF Chat"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#093344] text-white shadow-lg hover:bg-[#0D9488] flex items-center justify-center transition-all hover:scale-105"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 max-h-[70vh] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-[#093344] to-[#0D9488] text-white">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-bold">YRIF Chat</p>
              <p className="text-xs text-blue-100">Powered by Claude AI</p>
            </div>
            <button onClick={() => setOpen(false)} className="ml-auto p-1 rounded-lg hover:bg-white/20">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'bot' && (
                  <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5 mr-2">
                    <Bot className="w-3 h-3 text-[#0D9488]" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#093344] text-white rounded-br-md whitespace-pre-wrap'
                      : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-md'
                  }`}
                >
                  {msg.role === 'bot' ? renderMarkdown(msg.text) : msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5 mr-2">
                  <Bot className="w-3 h-3 text-[#0D9488]" />
                </div>
                <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-md px-4 py-2.5">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick prompts — show on first message only */}
          {messages.length === 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {[
                'Jinsi ya kusajili?',
                'YRIF ni nini?',
                'Wasilisha utafiti',
                'Pata mshauri',
                'Mawasiliano',
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => send(prompt)}
                  className="rounded-full border border-[#0D9488]/30 bg-teal-50 px-3 py-1 text-xs text-[#093344] hover:bg-teal-100 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-gray-100 bg-white">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') send() }}
                placeholder="Niulize chochote…"
                className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] transition-all duration-150"
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                className="rounded-xl bg-[#093344] hover:bg-[#0D9488] p-2.5 text-white transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
