import React, { useState } from 'react'
import { useStore } from '../../store/questStore'
import { X, Sparkles, Plus, Check } from 'lucide-react'
import { Category, Priority } from '../../types'

interface QuickCreateModalProps {
  isOpen: boolean
  onClose: () => void
}

type CreateType = 'task' | 'habit' | 'quest'

export const QuickCreateModal: React.FC<QuickCreateModalProps> = ({ isOpen, onClose }) => {
  const { addTask, addQuestItem } = useStore()
  const [createType, setCreateType] = useState<CreateType>('task')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category>('work')
  const [priority, setPriority] = useState<Priority>('medium')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    if (createType === 'task') {
      addTask({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        priority,
        xpReward: priority === 'urgent' ? 120 : priority === 'high' ? 80 : 50,
        coinReward: priority === 'urgent' ? 60 : priority === 'high' ? 40 : 20,
        isPinned: priority === 'urgent' || priority === 'high'
      })
    } else if (createType === 'quest') {
      addQuestItem({
        title: title.trim(),
        description: description.trim() || 'Đại nhiệm vụ quan trọng cần vượt qua',
        category,
        difficulty: 'hard',
        xpReward: 300,
        coinReward: 150,
        badgeIcon: '⚔️',
        milestones: [
          { id: `m-${Date.now()}-1`, title: 'Giai đoạn chuẩn bị', completed: false, xpReward: 100 },
          { id: `m-${Date.now()}-2`, title: 'Thực thi & Hoàn thiện', completed: false, xpReward: 200 }
        ]
      })
    }

    setTitle('')
    setDescription('')
    onClose()
  }

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(6px)',
      zIndex: 70,
      display: 'flex',
      alignItems: 'flex-end',
      animation: 'fadeIn 0.2s ease'
    }}>
      <div style={{
        width: '100%',
        background: 'var(--lq-surface)',
        borderRadius: '28px 28px 0 0',
        padding: '20px 20px 32px',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.25)',
        maxHeight: '90vh',
        overflowY: 'auto',
        animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: 'var(--lq-accent-soft)',
              color: 'var(--lq-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Plus size={18} strokeWidth={3} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--lq-ink)' }}>
              Tạo Mục Tiêu Mới
            </h3>
          </div>

          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--lq-surface-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--lq-ink-muted)'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Type tabs */}
        <div style={{ display: 'flex', background: 'var(--lq-surface-subtle)', padding: 4, borderRadius: 12, gap: 4, marginBottom: 14 }}>
          {[
            { id: 'task' as CreateType, label: 'Nhiệm vụ (Task)' },
            { id: 'quest' as CreateType, label: 'Đại nhiệm vụ (Quest)' }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setCreateType(t.id)}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 700,
                background: createType === t.id ? 'var(--lq-surface)' : 'transparent',
                color: createType === t.id ? 'var(--lq-ink)' : 'var(--lq-ink-muted)',
                boxShadow: createType === t.id ? 'var(--shadow-sm)' : 'none'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--lq-ink)' }}>
              Tiêu đề <span style={{ color: 'var(--lq-accent)' }}>*</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: Chạy bộ 3km, Đọc sách 20 trang..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 12,
                border: '1px solid var(--lq-border)',
                background: 'var(--lq-bg-elevated)',
                fontSize: 14,
                outline: 'none',
                fontFamily: 'inherit',
                color: 'var(--lq-ink)'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--lq-ink)' }}>
              Mô tả chi tiết (Tùy chọn)
            </label>
            <input
              type="text"
              placeholder="Ghi chú thêm..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 12,
                border: '1px solid var(--lq-border)',
                background: 'var(--lq-bg-elevated)',
                fontSize: 13,
                outline: 'none',
                fontFamily: 'inherit',
                color: 'var(--lq-ink)'
              }}
            />
          </div>

          {/* Category */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--lq-ink)' }}>
              Lĩnh vực
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {[
                { id: 'work' as Category, label: '💼 Công việc' },
                { id: 'fitness' as Category, label: '🏃 Thể lực' },
                { id: 'learning' as Category, label: '📚 Học tập' },
                { id: 'mindfulness' as Category, label: '🧘 Kỷ luật' }
              ].map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 16,
                    fontSize: 11,
                    fontWeight: 600,
                    border: '1px solid',
                    borderColor: category === c.id ? 'var(--lq-accent)' : 'var(--lq-border)',
                    background: category === c.id ? 'var(--lq-accent-soft)' : 'var(--lq-bg-elevated)',
                    color: category === c.id ? 'var(--lq-accent)' : 'var(--lq-ink-muted)'
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--lq-ink)' }}>
              Mức độ ưu tiên
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {[
                { id: 'low' as Priority, label: 'Thấp' },
                { id: 'medium' as Priority, label: 'Vừa' },
                { id: 'high' as Priority, label: 'Cao' },
                { id: 'urgent' as Priority, label: 'Khẩn cấp 🔥' }
              ].map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setPriority(p.id)}
                  style={{
                    padding: '7px 4px',
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 700,
                    border: '1px solid',
                    borderColor: priority === p.id ? 'var(--lq-accent)' : 'var(--lq-border)',
                    background: priority === p.id ? 'var(--lq-accent)' : 'var(--lq-surface)',
                    color: priority === p.id ? '#FFFFFF' : 'var(--lq-ink-muted)'
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            style={{
              marginTop: 10,
              background: 'linear-gradient(135deg, #F26B3A 0%, #DE5A2A 100%)',
              color: '#FFFFFF',
              padding: '13px',
              borderRadius: 16,
              fontSize: 14,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: 'var(--shadow-accent)'
            }}
          >
            <Plus size={18} strokeWidth={3} />
            <span>Thêm Ngay Vào Danh Sách</span>
          </button>
        </form>
      </div>
    </div>
  )
}
