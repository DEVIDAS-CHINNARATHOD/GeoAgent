import React from 'react'
import clsx from 'clsx'
import type { Message } from '../types'

interface Props {
  message: Message
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export const ChatMessage: React.FC<Props> = ({ message }) => {
  const isUser = message.role === 'user'
  const isLoading = message.isLoading

  return (
    <div
      className={clsx(
        'flex w-full animate-fade-up',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-accent-blue/20 border border-accent-blue/30 flex items-center justify-center mr-3 mt-0.5">
          <span className="text-[10px] font-semibold text-accent-blue tracking-wide">G</span>
        </div>
      )}

      <div className={clsx('max-w-[78%] flex flex-col', isUser ? 'items-end' : 'items-start')}>
        <div
          className={clsx(
            'px-4 py-3 rounded-2xl text-sm leading-relaxed',
            isUser
              ? 'bg-accent-blue text-white rounded-tr-sm'
              : 'glass-panel text-text-primary rounded-tl-sm'
          )}
        >
          {isLoading ? (
            <div className="flex items-center gap-1.5 py-0.5 px-1">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          ) : (
            <div className="whitespace-pre-wrap">{message.content}</div>
          )}
        </div>

        {!isLoading && !isUser && message.agent_trace && message.agent_trace.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5 max-w-full">
            {message.agent_trace.map((agent, i) => (
              <span
                key={i}
                className="text-[10px] px-2 py-0.5 rounded-full border border-white/8 text-text-tertiary bg-white/[0.03] font-mono tracking-wide"
              >
                {agent}
              </span>
            ))}
          </div>
        )}

        {!isLoading && message.sources && message.sources.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {message.sources.map((src, i) => (
              <span
                key={i}
                className="text-[10px] px-2 py-0.5 rounded-full text-text-tertiary bg-white/[0.04] border border-white/8"
              >
                {src.split('/').pop() || src}
              </span>
            ))}
          </div>
        )}

        <span className="text-[11px] text-text-tertiary mt-1.5 px-1">
          {formatTime(message.timestamp)}
        </span>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-white/10 border border-white/15 flex items-center justify-center ml-3 mt-0.5">
          <span className="text-[10px] font-medium text-text-secondary">You</span>
        </div>
      )}
    </div>
  )
}
