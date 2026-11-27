import React from 'react'
import { TabId } from '../../types'
import { Home, MessageSquare, Calendar, CheckSquare, Plus, LucideIcon } from 'lucide-react'

interface BottomNavProps {
  currentTab: TabId
  onSelectTab: (tab: TabId) => void
  onOpenCreate: () => void
  pendingTasksCount?: number
  unreadMessagesCount?: number
}

interface NavItemConfig {
  id: TabId
  label: string
  icon: LucideIcon
  badge?: number
  isActive: (current: TabId) => boolean
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenCreate,
  pendingTasksCount = 2,
  unreadMessagesCount = 3
}) => {
  const leftItems: NavItemConfig[] = [
    {
      id: 'dashboard',
      label: 'Trang chủ',
      icon: Home,
      isActive: (t) => t === 'dashboard'
    },
    {
      id: 'messages',
      label: 'Tin nhắn',
      icon: MessageSquare,
      badge: unreadMessagesCount,
      isActive: (t) => t === 'messages'
    }
  ]

  const rightItems: NavItemConfig[] = [
    {
      id: 'calendar',
      label: 'Lịch',
      icon: Calendar,
      isActive: (t) => t === 'calendar'
    },
    {
      id: 'work',
      label: 'Công việc',
      icon: CheckSquare,
      badge: pendingTasksCount,
      isActive: (t) => t === 'work' || t === 'tasks'
    }
  ]

  const renderTabButton = (item: NavItemConfig) => {
    const active = item.isActive(currentTab)
    const Icon = item.icon

    return (
      <button
        key={item.id}
        onClick={() => onSelectTab(item.id)}
        className={`lq-dock-tab ${active ? 'lq-dock-tab-active' : ''}`}
        style={{
          position: 'relative',
          border: active ? '1.5px solid rgba(242, 107, 58, 0.34)' : '1.5px solid transparent',
          background: active
            ? 'linear-gradient(180deg, #FFF4EC 0%, #FFE7D8 100%)'
            : 'transparent',
          borderRadius: 16,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          fontSize: 10.5,
          fontWeight: active ? 800 : 600,
          letterSpacing: active ? '0.01em' : '0',
          color: active ? '#D94E22' : '#586D80',
          cursor: 'pointer',
          width: 68,
          height: 50,
          padding: '4px 2px 5px',
          boxShadow: active
            ? '0 2px 8px rgba(242, 107, 58, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.9)'
            : 'none'
        }}
      >
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: active ? '#F26B3A' : '#4D6274',
            transform: active ? 'translateY(-1px)' : 'none',
            transition: 'transform 0.2s ease, color 0.2s ease',
            filter: active ? 'drop-shadow(0 2px 4px rgba(242, 107, 58, 0.28))' : 'none'
          }}
        >
          <Icon size={20} strokeWidth={active ? 2.5 : 2} />

          {item.badge !== undefined && item.badge > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -5,
                right: -8,
                background: 'linear-gradient(135deg, #FF7A45 0%, #E84A27 100%)',
                color: '#FFFFFF',
                fontSize: 9,
                fontWeight: 800,
                minWidth: 16,
                height: 16,
                padding: '0 4px',
                borderRadius: 99,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #FFFFFF',
                boxShadow: '0 2px 6px rgba(232, 74, 39, 0.38)'
              }}
            >
              {item.badge}
            </span>
          )}
        </div>

        <span style={{ lineHeight: 1.1 }}>{item.label}</span>

        {/* Quest Orange-Gold Diamond Indicator */}
        {active && (
          <span
            style={{
              position: 'absolute',
              bottom: -3,
              left: '50%',
              transform: 'translateX(-50%) rotate(45deg)',
              width: 5.5,
              height: 5.5,
              borderRadius: 1,
              background: '#F26B3A',
              boxShadow: '0 0 6px rgba(242, 107, 58, 0.65)'
            }}
          />
        )}
      </button>
    )
  }

  return (
    <>
      {/* Soft bottom gradient veil so scrolling cards dissolve smoothly behind the floating dock */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 100,
          background:
            'linear-gradient(to top, rgba(245, 243, 238, 0.98) 0%, rgba(245, 243, 238, 0.82) 52%, rgba(245, 243, 238, 0) 100%)',
          pointerEvents: 'none',
          zIndex: 45
        }}
      />

      {/* Signature LifeQuest Floating Web-Matched Cream/White Fox Dock */}
      <nav
        aria-label="Điều hướng chính LifeQuest"
        style={{
          position: 'absolute',
          bottom: 14,
          left: 12,
          right: 12,
          height: 66,
          borderRadius: 24,
          background: 'linear-gradient(180deg, #FFFFFF 0%, #FAF7F2 100%)',
          border: '1.5px solid #E8DFD2',
          boxShadow:
            '0 4px 0 #DDD2C3, 0 14px 30px rgba(22, 50, 74, 0.14), inset 0 1px 0 #FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 8px',
          zIndex: 50
        }}
      >
        {/* Subtle Warm Fox-Orange Accent Highlight across top center of dock */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 118,
            height: 2,
            borderRadius: 2,
            background:
              'linear-gradient(90deg, rgba(242,107,58,0) 0%, rgba(242,107,58,0.45) 50%, rgba(242,107,58,0) 100%)',
            pointerEvents: 'none'
          }}
        />

        {/* Left Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {leftItems.map(renderTabButton)}
        </div>

        {/* Center Iconic Fox-Eared Quest Orb (+) */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: -28,
            width: 64,
            height: 64
          }}
        >
          {/* Cute Sculpted Fox Ears Silhouette behind the orb */}
          <svg
            width="64"
            height="32"
            viewBox="0 0 64 32"
            fill="none"
            style={{
              position: 'absolute',
              top: -7,
              left: 0,
              pointerEvents: 'none',
              filter: 'drop-shadow(0 -2px 4px rgba(22, 50, 74, 0.25))'
            }}
          >
            {/* Left Fox Ear */}
            <path
              d="M9 22 L6 4.5 C5.7 2.4 7.9 1 9.8 2.1 L24 10.5 Z"
              fill="#F26B3A"
              stroke="#16324A"
              strokeWidth="2.8"
              strokeLinejoin="round"
            />
            <path
              d="M11 18 L9.5 7.5 L19 13 Z"
              fill="#FFF2E0"
            />
            {/* Right Fox Ear */}
            <path
              d="M55 22 L58 4.5 C58.3 2.4 56.1 1 54.2 2.1 L40 10.5 Z"
              fill="#F26B3A"
              stroke="#16324A"
              strokeWidth="2.8"
              strokeLinejoin="round"
            />
            <path
              d="M53 18 L54.5 7.5 L45 13 Z"
              fill="#FFF2E0"
            />
          </svg>

          <button
            onClick={onOpenCreate}
            className="lq-fox-orb"
            style={{
              position: 'relative',
              border: 'none',
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'linear-gradient(145deg, #FF9559 0%, #F26B3A 54%, #D94E22 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 2
            }}
            title="Tạo mới nhiệm vụ, thói quen, mục tiêu"
            aria-label="Tạo nhiệm vụ mới"
          >
            {/* Glossy top crescent sheen */}
            <span
              style={{
                position: 'absolute',
                top: 4,
                left: 10,
                right: 10,
                height: 16,
                borderRadius: '50%',
                background:
                  'linear-gradient(180deg, rgba(255, 255, 255, 0.42) 0%, rgba(255, 255, 255, 0) 100%)',
                pointerEvents: 'none'
              }}
            />

            <Plus size={28} strokeWidth={3} style={{ filter: 'drop-shadow(0 1px 2px rgba(138, 38, 8, 0.4))' }} />

            {/* Tiny Gold Sparkle Accent */}
            <span
              style={{
                position: 'absolute',
                top: 9,
                right: 10,
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: '#FFF4C2',
                boxShadow: '0 0 6px #FFF4C2',
                pointerEvents: 'none'
              }}
            />
          </button>
        </div>

        {/* Right Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {rightItems.map(renderTabButton)}
        </div>
      </nav>
    </>
  )
}

export default BottomNav
