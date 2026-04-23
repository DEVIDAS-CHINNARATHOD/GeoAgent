import React, { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { Send, MapPin, Trash2, Navigation } from 'lucide-react'
import { useChat } from '../hooks/useChat'
import { useLocation } from '../hooks/useLocation'
import { ChatMessage } from './ChatMessage'
import type { UserProfile } from '../types'

interface Props {
  userProfile?: UserProfile
}

const SUGGESTIONS = [
  'What are the top attractions in Bangalore?',
  'Best local food to try in Goa',
  'Safety tips for traveling in Jaipur',
  'Recommend a 3-day itinerary for Mysore',
]

export const ChatPanel: React.FC<Props> = ({ userProfile }) => {
  const [input, setInput] = useState('')
  const { messages, isLoading, error, sendMessage, clearMessages } = useChat()
  const { latitude, longitude, hasLocation, loading: locLoading, requestLocation } = useLocation()
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim() || isLoading) return
    const loc = hasLocation ? { latitude: latitude!, longitude: longitude! } : undefined
    sendMessage(input, loc, userProfile)
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = () => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div>
          <h2 className="text-sm font-semibold text-text-primary tracking-tight">
            Intelligence Chat
          </h2>
          <p className="text-xs text-text-tertiary mt-0.5">
            Multi-agent tourism assistant
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasLocation && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-green/10 border border-accent-green/20">
              <div className="w-1.5 h-1.5 rounded-full bg-accent-green" />
              <span className="text-[11px] text-accent-green font-medium">Located</span>
            </div>
          )}
          {!hasLocation && (
            <button
              onClick={requestLocation}
              disabled={locLoading}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full btn-ghost text-xs"
            >
              <Navigation className="w-3 h-3" />
              {locLoading ? 'Locating...' : 'Use Location'}
            </button>
          )}
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              className="p-1.5 rounded-lg btn-ghost"
              title="Clear conversation"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center mb-4">
              <MapPin className="w-5 h-5 text-accent-blue" />
            </div>
            <p className="text-sm font-medium text-text-secondary mb-1">Ask about any destination</p>
            <p className="text-xs text-text-tertiary mb-6 text-center max-w-xs">
              Get local insights, safety analysis, weather context, and personalized recommendations.
            </p>
            <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setInput(s)}
                  className="text-left px-3.5 py-2.5 rounded-xl glass-panel text-xs text-text-secondary hover:text-text-primary hover:bg-white/[0.06] transition-all duration-200"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)
        )}
        {error && (
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-accent-red/10 border border-accent-red/20">
            <span className="text-xs text-accent-red">{error}</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="px-4 pb-4">
        <div className="glass-panel-elevated rounded-2xl p-2 flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask about destinations, attractions, safety..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary resize-none outline-none px-2 py-1.5 leading-relaxed"
            style={{ maxHeight: 120 }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="btn-primary flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[10px] text-text-tertiary text-center mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
