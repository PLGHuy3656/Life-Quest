import React from 'react'
import { useStore } from '../../store/questStore'
import { Flame, Wifi, Battery, Sparkles } from 'lucide-react'
import { TabId } from '../../types'

interface TopBarProps {
  currentTab: TabId
  onNavigateTab: (tab: TabId) => void
  onOpenFigma?: () => void
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onNavigateTab
}) => {
  const { toggleFoxDrawer, player } = useStore()

  const getScreenTitle = () => {
    switch (currentTab) {
      case 'wardrobe':
        return 'Tủ đồ Fox'
      case 'dashboard':
        return 'Tổng quan'
      case 'work':
      case 'tasks':
        return 'Công việc'
      case 'calendar':
        return 'Lịch trình'
      case 'messages':
        return 'Tin nhắn'
      case 'focus':
        return 'Tập trung'
      case 'social':
        return 'Khám phá'
      case 'profile':
        return 'Hồ sơ'
      default:
        return 'Tổng quan'
    }
  }

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'linear-gradient(180deg, #FFFFFF 0%, rgba(250, 248, 244, 0.96) 100%)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        borderBottom: '1.5px solid #ECE4D8',
        boxShadow: '0 4px 16px rgba(22, 50, 74, 0.05)'
      }}
    >
      {/* 1. iOS Mobile Status Bar */}
      <div
        style={{
          padding: '6px 16px 2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 12,
          fontWeight: 700,
          color: '#16324A'
        }}
      >
        <span style={{ fontWeight: 800, fontSize: 13, letterSpacing: '-0.2px' }}>9:41</span>

        {/* Dynamic Island pill */}
        <div
          style={{
            width: 82,
            height: 20,
            background: '#0D161F',
            borderRadius: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6
          }}
        >
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#F26B3A' }} />
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981' }} />
        </div>

        {/* Signal, WiFi, Battery */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#16324A' }}>
          <span style={{ fontWeight: 800, fontSize: 10 }}>5G</span>
          <Wifi size={13} strokeWidth={2.5} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <span style={{ fontSize: 10, fontWeight: 800 }}>100%</span>
            <Battery size={15} strokeWidth={2.5} />
          </div>
        </div>
      </div>

      {/* 2. Gen Z Tactile App Header */}
      <header
        style={{
          padding: '8px 14px 11px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8
        }}
      >
        {/* Left: Official 3D Fox Avatar (tap -> Profile) + Punchy Brand Wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          {/* 3D Fox Avatar Badge */}
          <button
            onClick={() => onNavigateTab('profile')}
            title="Xem hồ sơ cá nhân"
            style={{
              position: 'relative',
              width: 40,
              height: 40,
              borderRadius: 15,
              background: 'linear-gradient(145deg, #FFE8D4 0%, #FFD0AD 100%)',
              border: '2px solid #F26B3A',
              boxShadow: '0 2.5px 0 #D95326, 0 5px 12px rgba(242, 107, 58, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <img
              src="/assets/fox/fox-cp3-center.png"
              alt="Fox Avatar"
              style={{
                width: 34,
                height: 34,
                objectFit: 'contain',
                transform: 'translateY(-1px)'
              }}
            />
            <span
              style={{
                position: 'absolute',
                bottom: -5,
                right: -5,
                background: 'linear-gradient(135deg, #1E3E5B 0%, #12263A 100%)',
                color: '#F6C85F',
                fontSize: 9,
                fontWeight: 900,
                padding: '1.5px 5px',
                borderRadius: 7,
                border: '1.5px solid #FFFFFF',
                boxShadow: '0 2px 4px rgba(22, 50, 74, 0.25)',
                lineHeight: 1.1
              }}
            >
              Lv.{player.level}
            </span>
          </button>

          {/* Brand Wordmark + Dynamic Page Pill */}
          <div
            onClick={() => onNavigateTab('dashboard')}
            style={{ cursor: 'pointer', minWidth: 0 }}
          >
            <div
              style={{
                fontSize: 16.5,
                fontWeight: 900,
                lineHeight: 1.08,
                letterSpacing: '-0.4px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <span style={{ color: '#16324A' }}>Life</span>
              <span
                style={{
                  background: 'linear-gradient(135deg, #FF8A4C 0%, #F26B3A 60%, #D9481E 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Quest
              </span>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                marginTop: 3,
                padding: '1.5px 7px',
                borderRadius: 99,
                background: '#F3ECE2',
                border: '1px solid #E6DDCF'
              }}
            >
              <span
                style={{
                  width: 5.5,
                  height: 5.5,
                  borderRadius: '50%',
                  background: '#168C78',
                  boxShadow: '0 0 5px rgba(22, 140, 120, 0.6)'
                }}
              />
              <span style={{ fontSize: 10, fontWeight: 800, color: '#475E72' }}>
                {getScreenTitle()}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Tactile Gen Z Streak Pill + Untouched Fox Paw Trigger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Tactile 3D Streak Pill */}
          <button
            onClick={() => onNavigateTab('work')}
            title="Chuỗi ngày liên tiếp"
            style={{
              height: 34,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: 'linear-gradient(180deg, #FFF4EA 0%, #FFE4CE 100%)',
              padding: '0 10px',
              borderRadius: 13,
              border: '1.5px solid #FAC8A8',
              boxShadow: '0 2.5px 0 #F1B793, 0 4px 10px rgba(242, 107, 58, 0.14)',
              fontSize: 12.5,
              fontWeight: 900,
              color: '#D94A1E',
              cursor: 'pointer'
            }}
          >
            <Flame size={15} fill="#F26B3A" color="#F26B3A" />
            <span>{player.streak}</span>
            <Sparkles size={11} color="#E69A28" />
          </button>

          {/* Fox Paw Trigger with Notification Badge (Kept as requested) */}
          <button
            onClick={toggleFoxDrawer}
            style={{
              position: 'relative',
              width: 34,
              height: 34,
              borderRadius: 12,
              background: '#F26B3A',
              color: '#FFFFFF',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              boxShadow: '0 2px 8px rgba(242, 107, 58, 0.35)',
              cursor: 'pointer'
            }}
            title="Bé Cáo Đồng Hành"
          >
            🐾
            <span
              style={{
                position: 'absolute',
                top: -3,
                right: -3,
                background: '#FFFFFF',
                color: '#F26B3A',
                fontSize: 9,
                fontWeight: 800,
                width: 14,
                height: 14,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
              }}
            >
              3
            </span>
          </button>
        </div>
      </header>
    </div>
  )
}
