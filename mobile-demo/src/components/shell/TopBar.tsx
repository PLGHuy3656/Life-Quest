import React from 'react'
import { useStore } from '../../store/questStore'
import { Flame, Coins, Bell, Moon, Sun } from 'lucide-react'
import { TabId } from '../../types'

interface TopBarProps {
  onNavigateTab: (tab: TabId) => void
}

export const TopBar: React.FC<TopBarProps> = ({ onNavigateTab }) => {
  const { player, toggleTheme, toggleFoxDrawer, isFoxDrawerOpen } = useStore()
  const xpPercent = Math.min(100, Math.round((player.currentLevelXp / player.nextLevelXp) * 100))

  return (
    <header style={{
      padding: '12px 16px 10px',
      background: 'var(--lq-surface)',
      borderBottom: '1px solid var(--lq-border)',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* User Info & Avatar */}
        <div
          onClick={() => onNavigateTab('profile')}
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
        >
          <div style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #16324A 0%, #1E4261 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            position: 'relative',
            boxShadow: '0 2px 6px rgba(22, 50, 74, 0.2)'
          }}>
            {player.avatar}
            <span style={{
              position: 'absolute',
              bottom: -3,
              right: -3,
              background: 'var(--lq-accent)',
              color: '#FFFFFF',
              fontSize: 9,
              fontWeight: 800,
              padding: '1px 4px',
              borderRadius: 6,
              border: '1.5px solid var(--lq-surface)'
            }}>
              {player.level}
            </span>
          </div>

          <div>
            <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--lq-ink)', lineHeight: 1.2 }}>
              {player.displayName}
            </div>
            <div style={{ fontSize: 10, color: 'var(--lq-ink-muted)', marginTop: 2 }}>
              Cấp {player.level} &bull; {player.currentLevelXp}/{player.nextLevelXp} XP
            </div>
          </div>
        </div>

        {/* Currency, Streak & Quick Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Streak */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            background: 'var(--lq-accent-soft)',
            padding: '4px 8px',
            borderRadius: 16,
            color: 'var(--lq-accent)',
            fontWeight: 800,
            fontSize: 11
          }}>
            <Flame size={13} className="animate-pulse-glow" />
            <span>{player.streak}</span>
          </div>

          {/* Coins */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            background: 'var(--lq-reward-soft)',
            padding: '4px 8px',
            borderRadius: 16,
            color: 'var(--lq-reward-ink)',
            fontWeight: 800,
            fontSize: 11
          }}>
            <Coins size={13} />
            <span>{player.coins}</span>
          </div>

          {/* Fox Paw Toggle (Companion Drawer) */}
          <button
            onClick={toggleFoxDrawer}
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: isFoxDrawerOpen ? 'var(--lq-accent)' : 'var(--lq-surface-subtle)',
              color: isFoxDrawerOpen ? '#FFFFFF' : 'var(--lq-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 15
            }}
            title="Bé Cáo Kitsu Đồng Hành"
          >
            🐾
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            style={{
              width: 30,
              height: 30,
              borderRadius: 10,
              background: 'var(--lq-surface-subtle)',
              color: 'var(--lq-ink-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Đổi giao diện sáng/tối"
          >
            {player.theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
          </button>
        </div>
      </div>

      {/* Level XP Progress Bar */}
      <div style={{
        height: 4,
        background: 'var(--lq-surface-subtle)',
        borderRadius: 2,
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${xpPercent}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #F26B3A 0%, #F6C85F 100%)',
          borderRadius: 2,
          transition: 'width 0.4s ease'
        }} />
      </div>
    </header>
  )
}
