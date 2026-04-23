import { useState, useCallback, useRef } from 'react'
import { api } from '../api/client'
import type { Message, UserProfile } from '../types'

function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sessionId = useRef<string>(generateId())

  const sendMessage = useCallback(
    async (
      query: string,
      location?: { latitude: number; longitude: number },
      userProfile?: UserProfile
    ) => {
      if (!query.trim() || isLoading) return

      const userMsg: Message = {
        id: generateId(),
        role: 'user',
        content: query.trim(),
        timestamp: new Date(),
      }
      const loadingMsg: Message = {
        id: generateId(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isLoading: true,
      }

      setMessages((prev) => [...prev, userMsg, loadingMsg])
      setIsLoading(true)
      setError(null)

      try {
        const response = await api.chat({
          query: query.trim(),
          latitude: location?.latitude,
          longitude: location?.longitude,
          user_profile: userProfile,
          session_id: sessionId.current,
        })

        const assistantMsg: Message = {
          id: generateId(),
          role: 'assistant',
          content: response.answer,
          timestamp: new Date(),
          sources: response.sources,
          agent_trace: response.agent_trace,
        }

        setMessages((prev) => {
          const without = prev.filter((m) => !m.isLoading)
          return [...without, assistantMsg]
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to get response'
        setError(msg)
        setMessages((prev) => prev.filter((m) => !m.isLoading))
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading]
  )

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
    sessionId.current = generateId()
  }, [])

  return { messages, isLoading, error, sendMessage, clearMessages }
}
