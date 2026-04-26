import React from 'react'
import { MessageSquare, Calendar, MapPin, User, Globe } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import clsx from 'clsx'
import type { ActiveTab } from '../types'

interface Props {
  active: ActiveTab
  onSelect: (tab: ActiveTab) => void
  onProfileClick: () => void
  profileOpen: boolean
}

const NAV_ITEMS: { id: ActiveTab; icon: LucideIcon; label: string }[] = [
  { id: 'chat', icon: MessageSquare, label: 'Chat' },
  { id: 'plan', icon: Calendar, label: 'Plan' },
  { id: 'nearby', icon: MapPin, label: 'Nearby' },
]

export const Sidebar: React.FC<Props> = ({ active, onSelect, onProfileClick, profileOpen }) => {
  return (
    <aside className="flex flex-col w-[72px] border-r border-white/[0.06] py-4 items-center gap-1 flex-shrink-0">
      {/* Logo */}
      <div className="mb-4 w-9 h-9 rounded-xl bg-accent-blue flex items-center justify-center flex-shrink-0 shadow-lg shadow-accent-blue/20">
        <Globe className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onSelect(id)}
            title={label}
            className={clsx(
              'group flex flex-col items-center gap-1 w-12 py-2.5 rounded-xl transition-all duration-150',
              active === id
                ? 'bg-accent-blue/15 text-accent-blue'
                : 'text-text-tertiary hover:text-text-secondary hover:bg-white/[0.05]'
            )}
          >
            <Icon className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
            <span className="text-[9px] font-medium tracking-wide uppercase">{label}</span>
          </button>
        ))}
      </nav>

      {/* Profile */}
      <button
        onClick={onProfileClick}
        title="Profile"
        className={clsx(
          'flex flex-col items-center gap-1 w-12 py-2.5 rounded-xl transition-all duration-150',
          profileOpen
            ? 'bg-white/[0.08] text-text-primary'
            : 'text-text-tertiary hover:text-text-secondary hover:bg-white/[0.05]'
        )}
      >
        <User style={{ width: 18, height: 18 }} />
        <span className="text-[9px] font-medium tracking-wide uppercase">Profile</span>
      </button>
    </aside>
  )
}
