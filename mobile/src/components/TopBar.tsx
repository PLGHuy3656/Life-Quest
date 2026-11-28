import React from 'react'
import { useStore } from '../store/questStore'
import { Flame, Coins, Shield } from 'lucide-react'

interface TopBarProps {
  onOpenProfile?: () => void
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenProfile }) => {
  const { player } = useStore()
  const xpPercentage = Math.min(100, Math.round((player.currentLevelXp / player.nextLevelXp) * 100))

  return (
    <header style={{
      padding: '12px 16px',
      background: 'rgba(255, 255, 255, 0.92)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 30,
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Player Avatar & Level */}
        <div 
          onClick={onOpenProfile}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer'
          }}
        >
          <div style={{
            width: 42,
            height: 42,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #16324A 0%, #1E4261 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            boxShadow: '0 2px 8px rgba(22, 50, 74, 0.2)',
            position: 'relative'
          }}>
            {player.avatar}
            <span style={{
              position: 'absolute',
              bottom: -4,
              right: -4,
              background: 'var(--accent)',
              color: '#fff',
              fontSize: 10,
              fontWeight: 800,
              padding: '2px 5px',
              borderRadius: 8,
              border: '2px solid #fff'
            }}>
              Lv.{player.level}
            </span>
          </div>

          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>
              {player.displayName}
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Shield size={11} color="var(--primary)" />
              Hiệp sĩ Cấp {player.level}
            </div>
          </div>
        </div>

        {/* Currency & Streak Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Streak */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'var(--accent-soft)',
            padding: '5px 10px',
            borderRadius: 20,
            color: 'var(--accent)',
            fontWeight: 700,
            fontSize: 12,
            border: '1px solid rgba(242, 107, 58, 0.2)'
          }}>
            <Flame size={14} className="animate-pulse" />
            <span>{player.streak} ngày</span>
          </div>

          {/* Coins */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'var(--gold-soft)',
            padding: '5px 10px',
            borderRadius: 20,
            color: 'var(--gold-text)',
            fontWeight: 700,
            fontSize: 12,
            border: '1px solid rgba(246, 200, 95, 0.35)'
          }}>
            <Coins size={14} />
            <span>{player.coins}</span>
          </div>
        </div>
      </div>

      {/* Level XP Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          flex: 1,
          height: 6,
          background: 'var(--bg-subtle)',
          borderRadius: 4,
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div style={{
            width: `${xpPercentage}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #F26B3A 0%, #F6C85F 100%)',
            borderRadius: 4,
            transition: 'width 0.4s ease'
          }} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-secondary)', minWidth: 65, textAlign: 'right' }}>
          {player.currentLevelXp}/{player.nextLevelXp} XP
        </span>
      </div>
    </header>
  )
}
