import React from 'react'
import { useStore } from '../../store/questStore'
import {
  Bell,
  Sparkles,
  ExternalLink,
  Flame,
  Wifi,
  Battery
} from 'lucide-react'
import { TabId } from '../../types'

interface TopBarProps {
  currentTab: TabId
  onNavigateTab: (tab: TabId) => void
  onOpenFigma: () => void
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onNavigateTab,
  onOpenFigma
}) => {
  const { toggleFoxDrawer, player } = useStore()

  // Screen title based on active tab
  const getScreenTitle = () => {
    switch (currentTab) {
      case 'wardrobe':
        return 'Tủ đồ Fox'
      case 'dashboard':
        return 'Tổng quan'
      case 'work':
        return 'Nhiệm vụ'
      case 'calendar':
        return 'Lịch trình'
      case 'focus':
        return 'Tập trung'
      case 'social':
        return 'Khám phá'
      case 'profile':
        return 'Hồ sơ'
      default:
        return 'LifeQuest'
    }
  }

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 40,
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(22, 50, 74, 0.08)',
      boxShadow: '0 2px 10px rgba(22, 50, 74, 0.03)'
    }}>
      {/* 1. iOS Mobile Status Bar */}
      <div style={{
        padding: '6px 16px 2px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 12,
        fontWeight: 700,
        color: '#16324A'
      }}>
        <span style={{ fontWeight: 800, fontSize: 13, letterSpacing: '-0.2px' }}>9:41</span>

        {/* Dynamic Island pill */}
        <div style={{
          width: 82,
          height: 20,
          background: '#0D161F',
          borderRadius: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6
        }}>
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

      {/* 2. Mobile App Header */}
      <header style={{
        padding: '8px 14px 10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8
      }}>
        {/* Left: Mascot Avatar + App Name + Level */}
        <div
          onClick={() => onNavigateTab('dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer'
          }}
        >
          <div style={{
            position: 'relative',
            width: 36,
            height: 36,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #FFE8D6 0%, #FFD6BA 100%)',
            border: '1.5px solid #F26B3A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            boxShadow: '0 2px 6px rgba(242, 107, 58, 0.25)'
          }}>
            🦊
            <span style={{
              position: 'absolute',
              bottom: -4,
              right: -4,
              background: '#16324A',
              color: '#F6C85F',
              fontSize: 9,
              fontWeight: 800,
              padding: '1px 4px',
              borderRadius: 6,
              border: '1px solid #FFFFFF'
            }}>
              Lv.{player.level}
            </span>
          </div>

          <div>
            <div style={{
              fontSize: 15,
              fontWeight: 800,
              color: '#16324A',
              lineHeight: 1.1,
              letterSpacing: '-0.3px',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}>
              <span>LifeQuest</span>
              <span style={{
                fontSize: 10,
                color: '#F26B3A',
                background: 'rgba(242, 107, 58, 0.1)',
                padding: '1px 5px',
                borderRadius: 6,
                fontWeight: 700
              }}>
                Mobile
              </span>
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#768796', marginTop: 1 }}>
              {getScreenTitle()}
            </div>
          </div>
        </div>

        {/* Right: Currencies + Figma + Fox Companion Trigger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Streak Flame */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            background: 'rgba(242, 107, 58, 0.08)',
            padding: '3px 7px',
            borderRadius: 12,
            border: '1px solid rgba(242, 107, 58, 0.2)',
            fontSize: 11,
            fontWeight: 800,
            color: '#F26B3A'
          }}>
            <Flame size={13} fill="#F26B3A" />
            <span>{player.streak}</span>
          </div>

          {/* Figma Spec Button */}
          <button
            onClick={onOpenFigma}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              padding: '4px 8px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(162, 89, 255, 0.12) 0%, rgba(10, 207, 131, 0.12) 100%)',
              border: '1px solid rgba(162, 89, 255, 0.3)',
              color: '#7C3AED',
              fontSize: 11,
              fontWeight: 800
            }}
            title="Mở Figma UI Kit"
          >
            <span>Figma</span>
            <ExternalLink size={10} />
          </button>

          {/* Fox Paw Trigger with Notification Badge */}
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
              boxShadow: '0 2px 8px rgba(242, 107, 58, 0.35)'
            }}
            title="Bé Cáo Đồng Hành"
          >
            🐾
            <span style={{
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
            }}>
              3
            </span>
          </button>
        </div>
      </header>
    </div>
  )
}
