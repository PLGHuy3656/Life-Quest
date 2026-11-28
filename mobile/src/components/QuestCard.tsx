import React from 'react'
import { Quest } from '../types'
import { Check, Flame, Coins, Zap, Trash2, Award } from 'lucide-react'

interface QuestCardProps {
  quest: Quest
  onToggle: (id: string) => void
  onDelete?: (id: string) => void
}

export const QuestCard: React.FC<QuestCardProps> = ({ quest, onToggle, onDelete }) => {
  const getDifficultyBadge = (diff: Quest['difficulty']) => {
    switch (diff) {
      case 'easy':
        return { label: 'Dễ', color: '#168C78', bg: 'rgba(22, 140, 120, 0.12)' }
      case 'medium':
        return { label: 'Vừa', color: '#16324A', bg: 'rgba(22, 50, 74, 0.08)' }
      case 'hard':
        return { label: 'Khó', color: '#F26B3A', bg: 'rgba(242, 107, 58, 0.12)' }
      case 'boss':
        return { label: 'TRÙM 👑', color: '#C84032', bg: 'rgba(200, 64, 50, 0.15)' }
    }
  }

  const getCategoryInfo = (cat: Quest['category']) => {
    switch (cat) {
      case 'fitness':
        return { label: 'Thể lực', icon: '🏃' }
      case 'learning':
        return { label: 'Học tập', icon: '📚' }
      case 'mindfulness':
        return { label: 'Kỷ luật', icon: '🧘' }
      case 'social':
        return { label: 'Xã hội', icon: '🤝' }
      case 'work':
      default:
        return { label: 'Công việc', icon: '💼' }
    }
  }

  const diff = getDifficultyBadge(quest.difficulty)
  const cat = getCategoryInfo(quest.category)

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '14px',
        opacity: quest.completed ? 0.65 : 1,
        transition: 'all 0.25s ease',
        background: quest.completed ? '#FAF9F6' : '#FFFFFF',
        borderColor: quest.difficulty === 'boss' ? '#E63946' : 'var(--border)'
      }}
    >
      {/* Gamified Checkbox Button */}
      <button
        onClick={() => onToggle(quest.id)}
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          border: quest.completed ? 'none' : '2px solid var(--border-strong)',
          background: quest.completed
            ? 'linear-gradient(135deg, #168C78 0%, #116B5C 100%)'
            : 'var(--bg-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: 2,
          boxShadow: quest.completed ? '0 2px 8px rgba(22, 140, 120, 0.3)' : 'none',
          transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}
        aria-label="Đánh dấu hoàn thành"
      >
        {quest.completed && <Check size={20} color="#FFFFFF" strokeWidth={3} />}
      </button>

      {/* Main Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Title */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6,
          marginBottom: 4
        }}>
          <h4 style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--ink)',
            textDecoration: quest.completed ? 'line-through' : 'none',
            lineHeight: 1.35
          }}>
            {quest.title}
          </h4>

          {onDelete && (
            <button
              onClick={() => onDelete(quest.id)}
              style={{
                background: 'transparent',
                color: 'var(--ink-muted)',
                padding: 4,
                display: 'flex',
                alignItems: 'center'
              }}
              title="Xóa nhiệm vụ"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>

        {/* Description if present */}
        {quest.description && (
          <p style={{
            fontSize: 12,
            color: 'var(--ink-secondary)',
            marginBottom: 8,
            lineHeight: 1.4
          }}>
            {quest.description}
          </p>
        )}

        {/* Tags & Rewards Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 6,
          marginTop: 6
        }}>
          {/* Category & Difficulty */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              background: 'var(--bg-subtle)',
              padding: '3px 7px',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 3
            }}>
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </span>

            <span style={{
              fontSize: 11,
              fontWeight: 700,
              color: diff.color,
              background: diff.bg,
              padding: '3px 7px',
              borderRadius: 6
            }}>
              {diff.label}
            </span>

            {quest.streak !== undefined && quest.streak > 0 && (
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}>
                <Flame size={12} /> {quest.streak}
              </span>
            )}
          </div>

          {/* Reward Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              fontSize: 11,
              fontWeight: 800,
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <Zap size={12} /> +{quest.xpReward} XP
            </span>

            <span style={{
              fontSize: 11,
              fontWeight: 800,
              color: 'var(--gold-text)',
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <Coins size={12} /> +{quest.coinReward}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
