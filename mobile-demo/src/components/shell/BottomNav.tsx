import React from 'react'
import { TabId } from '../../types'
import { Home, Swords, Calendar, Timer, Sparkles } from 'lucide-react'

interface BottomNavProps {
  currentTab: TabId
  onSelectTab: (tab: TabId) => void
  pendingTasksCount: number
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  pendingTasksCount
}) => {
  const tabs = [
    { id: 'dashboard' as TabId, label: 'Trang chủ', icon: Home },
    { id: 'work' as TabId, label: 'Công việc', icon: Swords, badge: pendingTasksCount },
    { id: 'calendar' as TabId, label: 'Lịch trình', icon: Calendar },
    { id: 'focus' as TabId, label: 'Tập trung', icon: Timer },
    { id: 'wardrobe' as TabId, label: 'Tủ đồ Fox', icon: Sparkles }
  ]

  return (
    <nav style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 'var(--bnav-h)',
      background: 'var(--lq-surface)',
      borderTop: '1px solid var(--lq-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      zIndex: 50,
      boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.04)',
      padding: '0 4px'
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
              color: isActive ? 'var(--lq-accent)' : 'var(--lq-ink-muted)',
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
              background: isActive ? 'var(--lq-accent-soft)' : 'transparent',
              transition: 'all 0.2s ease'
            }}>
              <Icon size={19} strokeWidth={isActive ? 2.5 : 2} />

              {tab.badge && tab.badge > 0 ? (
                <span style={{
                  position: 'absolute',
                  top: -2,
                  right: -4,
                  background: 'var(--lq-accent)',
                  color: '#FFFFFF',
                  fontSize: 10,
                  fontWeight: 800,
                  minWidth: 16,
                  height: 16,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                  border: '2px solid var(--lq-surface)'
                }}>
                  {tab.badge}
                </span>
              ) : null}
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
