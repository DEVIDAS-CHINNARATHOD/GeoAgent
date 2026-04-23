import React, { useEffect, useState } from 'react'
import { api } from '../api/client'

type Status = 'checking' | 'online' | 'offline'

export const StatusBar: React.FC = () => {
  const [status, setStatus] = useState<Status>('checking')
  const [version, setVersion] = useState<string>('')

  useEffect(() => {
    const check = async () => {
      try {
        const data = await api.health()
        setStatus('online')
        setVersion(data.version)
      } catch {
        setStatus('offline')
      }
    }
    check()
    const interval = setInterval(check, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center justify-between px-5 py-2.5 border-b border-white/[0.05] bg-surface-raised/60 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-text-primary tracking-tight">GeoAgent</span>
        {version && (
          <span className="text-[10px] text-text-tertiary font-mono">v{version}</span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <div
          className={
            status === 'online'
              ? 'w-1.5 h-1.5 rounded-full bg-accent-green'
              : status === 'offline'
              ? 'w-1.5 h-1.5 rounded-full bg-accent-red'
              : 'w-1.5 h-1.5 rounded-full bg-accent-amber animate-pulse'
          }
        />
        <span className="text-[11px] text-text-tertiary">
          {status === 'checking' ? 'Connecting...' : status === 'online' ? 'System Online' : 'Backend Offline'}
        </span>
      </div>
    </div>
  )
}
