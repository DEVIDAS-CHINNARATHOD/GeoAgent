import React, { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { StatusBar } from './components/StatusBar'
import { ChatPanel } from './components/ChatPanel'
import { ItineraryPanel } from './components/ItineraryPanel'
import { NearbyPanel } from './components/NearbyPanel'
import { ProfilePanel } from './components/ProfilePanel'
import type { ActiveTab, UserProfile } from './types'

const DEFAULT_PROFILE: UserProfile = {
  budget: 'medium',
  interests: [],
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat')
  const [profileOpen, setProfileOpen] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE)

  const handleTabSelect = (tab: ActiveTab) => {
    setActiveTab(tab)
    setProfileOpen(false)
  }

  const handleProfileClick = () => {
    setProfileOpen((prev) => !prev)
  }

  const renderMainPanel = () => {
    if (profileOpen) {
      return <ProfilePanel profile={userProfile} onChange={setUserProfile} />
    }
    switch (activeTab) {
      case 'chat':
        return <ChatPanel userProfile={userProfile} />
      case 'plan':
        return <ItineraryPanel userProfile={userProfile} />
      case 'nearby':
        return <NearbyPanel />
      default:
        return null
    }
  }

  return (
    <div className="h-dvh flex flex-col bg-surface overflow-hidden">
      {/* Top status bar */}
      <StatusBar />

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <Sidebar
          active={activeTab}
          onSelect={handleTabSelect}
          onProfileClick={handleProfileClick}
          profileOpen={profileOpen}
        />

        {/* Main content */}
        <main className="flex-1 flex flex-col min-w-0 relative">
          {/* Ambient background gradient */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 60% 40% at 70% 20%, rgba(10,132,255,0.04) 0%, transparent 70%), radial-gradient(ellipse 50% 30% at 20% 80%, rgba(50,210,255,0.03) 0%, transparent 70%)',
            }}
          />

          <div className="relative flex-1 min-h-0 overflow-hidden">
            {renderMainPanel()}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden flex items-center border-t border-white/[0.06] bg-surface-raised/80 backdrop-blur-sm">
        {(['chat', 'plan', 'nearby'] as ActiveTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabSelect(tab)}
            className={`flex-1 py-3 text-xs font-medium capitalize transition-colors ${
              activeTab === tab && !profileOpen
                ? 'text-accent-blue'
                : 'text-text-tertiary'
            }`}
          >
            {tab}
          </button>
        ))}
        <button
          onClick={handleProfileClick}
          className={`flex-1 py-3 text-xs font-medium capitalize transition-colors ${
            profileOpen ? 'text-accent-blue' : 'text-text-tertiary'
          }`}
        >
          Profile
        </button>
      </nav>
    </div>
  )
}
