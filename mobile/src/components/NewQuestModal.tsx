import React, { useState } from 'react'
import { Difficulty, QuestCategory, QuestType } from '../types'
import { X, Sparkles, Plus } from 'lucide-react'

interface NewQuestModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (quest: {
    title: string
    description?: string
    type: QuestType
    difficulty: Difficulty
    category: QuestCategory
    xpReward: number
    coinReward: number
  }) => void
}

export const NewQuestModal: React.FC<NewQuestModalProps> = ({
  isOpen,
  onClose,
  onAdd
}) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<QuestType>('daily')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [category, setCategory] = useState<QuestCategory>('work')

  if (!isOpen) return null

  // Calculate dynamic rewards
  const getRewards = (diff: Difficulty) => {
    switch (diff) {
      case 'easy':
        return { xp: 30, coins: 15 }
      case 'medium':
        return { xp: 60, coins: 30 }
      case 'hard':
        return { xp: 120, coins: 60 }
      case 'boss':
        return { xp: 250, coins: 120 }
    }
  }

  const rewards = getRewards(difficulty)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    onAdd({
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      difficulty,
      category,
      xpReward: rewards.xp,
      coinReward: rewards.coins
    })

    setTitle('')
    setDescription('')
    onClose()
  }

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'rgba(22, 50, 74, 0.45)',
      backdropFilter: 'blur(6px)',
      zIndex: 50,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      animation: 'fadeIn 0.2s ease'
    }}>
      <div style={{
        width: '100%',
        background: '#FFFFFF',
        borderRadius: '28px 28px 0 0',
        padding: '20px 20px 32px',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.2)',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: 'var(--accent-soft)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles size={18} />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--ink)' }}>
              Tạo Nhiệm Vụ Mới
            </h3>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'var(--bg-subtle)',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--ink-secondary)'
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Title input */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--ink)' }}>
              Tên nhiệm vụ <span style={{ color: 'var(--accent)' }}>*</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: Đọc sách 20 trang, Luyện code..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 12,
                border: '1.5px solid var(--border)',
                fontSize: 14,
                outline: 'none',
                fontFamily: 'inherit',
                background: 'var(--bg-elevated)'
              }}
            />
          </div>

          {/* Description input */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--ink)' }}>
              Ghi chú thêm (Tùy chọn)
            </label>
            <input
              type="text"
              placeholder="VD: Mục tiêu hoàn thành trước 18h..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 12,
                border: '1.5px solid var(--border)',
                fontSize: 13,
                outline: 'none',
                fontFamily: 'inherit',
                background: 'var(--bg-elevated)'
              }}
            />
          </div>

          {/* Quest Type Selection */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--ink)' }}>
              Phân loại
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {[
                { id: 'daily' as QuestType, label: 'Hàng ngày' },
                { id: 'habit' as QuestType, label: 'Thói quen' },
                { id: 'quest' as QuestType, label: 'Nhiệm vụ' },
                { id: 'milestone' as QuestType, label: 'Cột mốc' }
              ].map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setType(t.id)}
                  style={{
                    padding: '8px 4px',
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 700,
                    border: '1px solid',
                    borderColor: type === t.id ? 'var(--primary)' : 'var(--border)',
                    background: type === t.id ? 'var(--primary)' : 'var(--bg-card)',
                    color: type === t.id ? '#FFFFFF' : 'var(--ink-secondary)'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Selection */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--ink)' }}>
              Lĩnh vực
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {[
                { id: 'fitness' as QuestCategory, label: '🏃 Thể lực' },
                { id: 'learning' as QuestCategory, label: '📚 Học tập' },
                { id: 'work' as QuestCategory, label: '💼 Công việc' },
                { id: 'mindfulness' as QuestCategory, label: '🧘 Kỷ luật' },
                { id: 'social' as QuestCategory, label: '🤝 Xã hội' }
              ].map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  style={{
                    padding: '7px 12px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                    border: '1px solid',
                    borderColor: category === c.id ? 'var(--accent)' : 'var(--border)',
                    background: category === c.id ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                    color: category === c.id ? 'var(--accent)' : 'var(--ink-secondary)'
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty & Rewards */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>
                Độ khó & Phần thưởng
              </label>
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent)' }}>
                +{rewards.xp} XP &bull; +{rewards.coins} Vàng
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {[
                { id: 'easy' as Difficulty, label: 'Dễ' },
                { id: 'medium' as Difficulty, label: 'Vừa' },
                { id: 'hard' as Difficulty, label: 'Khó' },
                { id: 'boss' as Difficulty, label: 'Trùm 👑' }
              ].map((d) => (
                <button
                  type="button"
                  key={d.id}
                  onClick={() => setDifficulty(d.id)}
                  style={{
                    padding: '8px 4px',
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 700,
                    border: '1px solid',
                    borderColor: difficulty === d.id ? 'var(--accent)' : 'var(--border)',
                    background: difficulty === d.id ? 'var(--accent)' : 'var(--bg-card)',
                    color: difficulty === d.id ? '#FFFFFF' : 'var(--ink-secondary)'
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            style={{
              marginTop: 10,
              background: 'linear-gradient(135deg, #F26B3A 0%, #DE5A2A 100%)',
              color: '#FFFFFF',
              padding: '14px',
              borderRadius: 16,
              fontSize: 15,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 14px rgba(242, 107, 58, 0.35)'
            }}
          >
            <Plus size={20} strokeWidth={3} />
            <span>Thêm Nhiệm Vụ Ngay</span>
          </button>
        </form>
      </div>
    </div>
  )
}
