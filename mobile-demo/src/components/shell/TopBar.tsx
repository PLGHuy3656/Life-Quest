import React from 'react'
import { useStore } from '../../store/questStore'
import {
  Home,
  Layers,
  Calendar,
  ShoppingBag,
  Search,
  Settings,
  Bell,
  Volume2,
  LogIn,
  ExternalLink
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
  const { toggleFoxDrawer } = useStore()

  const navItems = [
    { id: 'dashboard' as TabId, icon: Home, label: 'Trang chủ' },
    { id: 'work' as TabId, icon: Layers, label: 'Nhiệm vụ' },
    { id: 'calendar' as TabId, icon: Calendar, label: 'Lịch' },
    { id: 'wardrobe' as TabId, icon: ShoppingBag, label: 'Tủ đồ' },
    { id: 'social' as TabId, icon: Search, label: 'Tìm kiếm' },
    { id: 'profile' as TabId, icon: Settings, label: 'Cài đặt' }
  ]

  return (
    <header style={{
      padding: '8px 14px',
      background: '#FFFFFF',
      borderBottom: '1px solid rgba(22, 50, 74, 0.08)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      boxShadow: '0 2px 8px rgba(22, 50, 74, 0.04)'
    }}>
      {/* 1. Left: LifeQuest Logo */}
      <div
        onClick={() => onNavigateTab('dashboard')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          cursor: 'pointer',
          flexShrink: 0
        }}
      >
        <span style={{ fontSize: 20 }}>🦊</span>
        <span style={{
          fontSize: 16,
          fontWeight: 800,
          color: '#16324A',
          letterSpacing: '-0.3px'
        }}>
          LifeQuest
        </span>
      </div>

      {/* 2. Center: Navigation Icon Pills (Matches desktop screenshot!) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: '#FAF6EE',
        padding: '3px 4px',
        borderRadius: 24,
        border: '1px solid #EFE6D8',
        gap: 2
      }}>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentTab === item.id

          return (
            <button
              key={item.id}
              onClick={() => onNavigateTab(item.id)}
              style={{
                width: 32,
                height: 30,
                borderRadius: 16,
                border: isActive ? '1.5px solid #F26B3A' : 'none',
                background: isActive ? '#FFFFFF' : 'transparent',
                color: isActive ? '#F26B3A' : '#768796',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isActive ? '0 2px 6px rgba(242, 107, 58, 0.15)' : 'none',
                transition: 'all 0.15s ease'
              }}
              title={item.label}
            >
              <Icon size={16} strokeWidth={isActive ? 2.4 : 1.8} />
            </button>
          )
        })}
      </div>

      {/* 3. Right: Quick Actions & Figma Link */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {/* Figma Link Pill */}
        <button
          onClick={onOpenFigma}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '5px 9px',
            borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(10, 207, 131, 0.15) 0%, rgba(162, 89, 255, 0.2) 100%)',
            border: '1px solid rgba(162, 89, 255, 0.35)',
            color: '#16324A',
            fontSize: 11,
            fontWeight: 800
          }}
          title="Mở liên kết Figma Design"
        >
          <span style={{ fontSize: 11, color: '#A259FF', fontWeight: 800 }}>Figma</span>
          <ExternalLink size={11} color="#A259FF" />
        </button>

        {/* Notification Bell */}
        <button
          style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: '#FAF6EE',
            border: '1px solid #EFE6D8',
            color: '#4D6274',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}
        >
          <Bell size={14} />
          <div style={{
            position: 'absolute',
            top: 5,
            right: 5,
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#F26B3A'
          }} />
        </button>

        {/* Login Button (Matches desktop screenshot!) */}
        <button
          onClick={() => onNavigateTab('profile')}
          style={{
            border: 'none',
            background: '#16324A',
            color: '#FFFFFF',
            borderRadius: 16,
            padding: '5px 10px',
            fontSize: 11,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            boxShadow: '0 2px 6px rgba(22, 50, 74, 0.2)'
          }}
        >
          <LogIn size={12} />
          <span>Đăng nhập</span>
        </button>
      </div>
    </header>
  )
}
