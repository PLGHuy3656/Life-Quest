import React from 'react'
import { useStore } from '../../store/questStore'
import { Flame, Coins, Moon, Sun, Layers } from 'lucide-react'
import { TabId } from '../../types'
import { MascotVisual } from '../common/MascotVisual'

interface TopBarProps {
  onNavigateTab: (tab: TabId) => void
  onOpenFigma: () => void
}

export const TopBar: React.FC<TopBarProps> = ({ onNavigateTab, onOpenFigma }) => {
  const { player, fox, toggleTheme, toggleFoxDrawer, isFoxDrawerOpen } = useStore()
  const xpPercent = Math.min(100, Math.round((player.currentLevelXp / player.nextLevelXp) * 100))

  return (
    <header style={{
      padding: '10px 14px 8px',
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
        {/* User Info & Mascot Avatar */}
        <div
          onClick={() => onNavigateTab('profile')}
          style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
        >
          <div style={{
            position: 'relative',
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: 'var(--lq-surface-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1.5px solid var(--lq-border)'
          }}>
            <MascotVisual
              size={32}
              equippedHat={fox.equippedHat}
              equippedAccessory={fox.equippedAccessory}
            />
            <span style={{
              position: 'absolute',
              bottom: -2,
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

        {/* Currency, Figma Link & Mascot Paw */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Streak */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            background: 'var(--lq-accent-soft)',
            padding: '4px 7px',
            borderRadius: 14,
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
            padding: '4px 7px',
            borderRadius: 14,
            color: 'var(--lq-reward-ink)',
            fontWeight: 800,
            fontSize: 11
          }}>
            <Coins size={13} />
            <span>{player.coins}</span>
          </div>

          {/* FIGMA LINK BUTTON */}
          <button
            onClick={onOpenFigma}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 8px',
              borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(10, 207, 131, 0.15) 0%, rgba(162, 89, 255, 0.2) 100%)',
              border: '1px solid rgba(162, 89, 255, 0.35)',
              color: 'var(--lq-ink)',
              fontSize: 11,
              fontWeight: 800
            }}
            title="Mở liên kết bản vẽ Figma"
          >
            <Layers size={13} color="#A259FF" />
            <span style={{ fontSize: 10 }}>Figma</span>
          </button>

          {/* Fox Paw Toggle */}
          <button
            onClick={toggleFoxDrawer}
            style={{
              width: 30,
              height: 30,
              borderRadius: 10,
              background: isFoxDrawerOpen ? 'var(--lq-accent)' : 'var(--lq-surface-subtle)',
              color: isFoxDrawerOpen ? '#FFFFFF' : 'var(--lq-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14
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
            {player.theme === 'light' ? <Moon size={13} /> : <Sun size={13} />}
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
