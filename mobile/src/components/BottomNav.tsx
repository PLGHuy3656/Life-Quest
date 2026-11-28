import React from 'react'
import { Home, Swords, Timer, Sparkles, User } from 'lucide-react'

export type TabType = 'home' | 'quests' | 'focus' | 'wardrobe' | 'profile'

interface BottomNavProps {
  currentTab: TabType
  onSelectTab: (tab: TabType) => void
  activeQuestCount: number
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  activeQuestCount
}) => {
  const tabs = [
    { id: 'home' as TabType, label: 'Trang chủ', icon: Home },
    { id: 'quests' as TabType, label: 'Nhiệm vụ', icon: Swords, badge: activeQuestCount > 0 ? activeQuestCount : undefined },
    { id: 'focus' as TabType, label: 'Tập trung', icon: Timer },
    { id: 'wardrobe' as TabType, label: 'Tủ đồ Fox', icon: Sparkles },
    { id: 'profile' as TabType, label: 'Hồ sơ', icon: User }
  ]

  return (
    <nav style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 'var(--bottom-nav-h)',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(16px)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      padding: '0 8px calc(var(--safe-bottom) / 2)',
      zIndex: 40,
      boxShadow: '0 -4px 16px rgba(22, 50, 74, 0.04)'
    }}>
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = currentTab === tab.id

        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              background: 'transparent',
              color: isActive ? 'var(--accent)' : 'var(--ink-secondary)',
              padding: '6px 0',
              position: 'relative'
            }}
          >
            <div style={{
              position: 'relative',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 12,
              background: isActive ? 'var(--accent-soft)' : 'transparent',
              transition: 'all 0.2s ease'
            }}>
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              
              {tab.badge && (
                <span style={{
                  position: 'absolute',
                  top: -2,
                  right: -4,
                  background: 'var(--accent)',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 800,
                  minWidth: 16,
                  height: 16,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                  border: '2px solid #fff'
                }}>
                  {tab.badge}
                </span>
              )}
            </div>

            <span style={{
              fontSize: 11,
              fontWeight: isActive ? 700 : 500,
              letterSpacing: '-0.2px'
            }}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
