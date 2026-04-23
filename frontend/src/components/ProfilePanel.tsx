import React from 'react'
import { User, Wallet, Heart } from 'lucide-react'
import clsx from 'clsx'
import type { UserProfile, BudgetLevel, InterestCategory } from '../types'

interface Props {
  profile: UserProfile
  onChange: (profile: UserProfile) => void
}

const BUDGET_OPTIONS: { value: BudgetLevel; label: string; desc: string }[] = [
  { value: 'low', label: 'Budget', desc: 'Hostels, street food, public transit' },
  { value: 'medium', label: 'Moderate', desc: 'Mid-range hotels and restaurants' },
  { value: 'high', label: 'Luxury', desc: 'Premium stays and fine dining' },
]

const INTEREST_OPTIONS: { value: InterestCategory; label: string }[] = [
  { value: 'history', label: 'History' },
  { value: 'food', label: 'Food' },
  { value: 'nature', label: 'Nature' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'culture', label: 'Culture' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'nightlife', label: 'Nightlife' },
]

export const ProfilePanel: React.FC<Props> = ({ profile, onChange }) => {
  const toggleInterest = (interest: InterestCategory) => {
    const current = profile.interests
    const updated = current.includes(interest)
      ? current.filter((i) => i !== interest)
      : [...current, interest]
    onChange({ ...profile, interests: updated })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <h2 className="text-sm font-semibold text-text-primary tracking-tight">Travel Profile</h2>
        <p className="text-xs text-text-tertiary mt-0.5">Personalize your recommendations</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
        {/* Profile summary badge */}
        <div className="flex items-center gap-3 px-4 py-3 glass-panel rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-accent-blue/15 border border-accent-blue/25 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-accent-blue" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">
              {profile.budget.charAt(0).toUpperCase() + profile.budget.slice(1)} traveler
            </p>
            <p className="text-xs text-text-tertiary">
              {profile.interests.length > 0
                ? profile.interests.join(', ')
                : 'No interests selected yet'}
            </p>
          </div>
        </div>

        {/* Budget */}
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <Wallet className="w-3.5 h-3.5 text-text-secondary" />
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Budget Level
            </p>
          </div>
          <div className="space-y-2">
            {BUDGET_OPTIONS.map(({ value, label, desc }) => (
              <button
                key={value}
                onClick={() => onChange({ ...profile, budget: value })}
                className={clsx(
                  'w-full text-left px-4 py-3 rounded-xl border transition-all duration-150',
                  profile.budget === value
                    ? 'bg-accent-blue/12 border-accent-blue/35 text-text-primary'
                    : 'glass-panel text-text-secondary hover:text-text-primary hover:border-white/15'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{label}</span>
                  {profile.budget === value && (
                    <div className="w-2 h-2 rounded-full bg-accent-blue" />
                  )}
                </div>
                <p className="text-xs text-text-tertiary mt-0.5">{desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Interests */}
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <Heart className="w-3.5 h-3.5 text-text-secondary" />
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Interests
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => toggleInterest(value)}
                className={clsx(
                  'px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-all duration-150',
                  profile.interests.includes(value)
                    ? 'bg-accent-blue/15 border-accent-blue/35 text-accent-blue'
                    : 'glass-panel text-text-secondary hover:text-text-primary hover:border-white/15'
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-text-tertiary mt-2">
            {profile.interests.length} selected — used to personalize all recommendations
          </p>
        </div>

        {/* Travel style */}
        <div>
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
            Travel Style (Optional)
          </p>
          <input
            type="text"
            value={profile.travel_style || ''}
            onChange={(e) => onChange({ ...profile, travel_style: e.target.value || undefined })}
            placeholder="e.g. solo backpacker, family with kids, digital nomad..."
            className="input-base w-full px-3.5 py-2.5 rounded-xl text-sm"
          />
        </div>

        {/* Reset */}
        <button
          onClick={() => onChange({ budget: 'medium', interests: [] })}
          className="btn-ghost w-full py-2 rounded-xl text-xs"
        >
          Reset to defaults
        </button>
      </div>
    </div>
  )
}
