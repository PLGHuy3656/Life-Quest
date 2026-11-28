import React, { useState } from 'react'
import { CheckSquare, Repeat, MapPin, X } from 'lucide-react'
import { useStore } from '../store/questStore'
import confetti from 'canvas-confetti'

interface CreateSheetModalProps {
  isOpen: boolean
  onClose: () => void
}

export const CreateSheetModal: React.FC<CreateSheetModalProps> = ({
  isOpen,
  onClose
}) => {
  const { addTask } = useStore()
  const [itemType, setItemType] = useState<'task' | 'habit' | 'quest'>('task')
  const [title, setTitle] = useState('')

  if (!isOpen) return null

  const handleCreate = () => {
    if (!title.trim()) return
    addTask({
      title: title.trim(),
      priority: 'high',
      category: 'work',
      dueDate: 'Hôm nay',
      xpReward: itemType === 'quest' ? 100 : itemType === 'habit' ? 30 : 50,
      coinReward: 20
    })
    confetti({ particleCount: 50, spread: 60 })
    setTitle('')
    onClose()
  }

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      pointerEvents: 'auto'
    }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(22, 50, 74, 0.45)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)'
        }}
      />

      {/* Slide-up Sheet */}
      <div style={{
        position: 'relative',
        background: '#FFFFFF',
        borderRadius: '28px 28px 0 0',
        padding: '14px 18px 36px',
        boxShadow: '0 -20px 56px rgba(22, 50, 74, 0.22)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        zIndex: 101,
        animation: 'slideUp 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)'
      }}>
        {/* Grab bar */}
        <div style={{
          width: 40,
          height: 5,
          borderRadius: 9,
          background: 'var(--lq-border)',
          alignSelf: 'center',
          marginBottom: 4
        }} />

        {/* Sheet Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--lq-ink)' }}>
            Hôm nay bạn muốn làm gì?
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <img
              src="/assets/fox/fox-mood-cheer-anim.webp"
              alt="Fox Cheer"
              style={{ width: 52, height: 'auto', objectFit: 'contain' }}
              onError={(e) => {
                ;(e.target as HTMLImageElement).src = '/assets/fox/fox-mood-cheer.png'
              }}
            />
            <button
              onClick={onClose}
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: 'var(--lq-surface-subtle)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--lq-ink-muted)'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* 1. Option Task */}
        <div
          onClick={() => setItemType('task')}
          style={{
            background: itemType === 'task' ? 'var(--lq-accent-soft)' : '#FFFFFF',
            border: itemType === 'task' ? '2px solid var(--lq-accent)' : '1px solid var(--lq-border)',
            borderRadius: 18,
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'var(--lq-accent)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <CheckSquare size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <b style={{ fontSize: 14, color: 'var(--lq-ink)' }}>Task</b>
            <div style={{ fontSize: 11.5, color: 'var(--lq-ink-muted)' }}>
              Việc cần làm có thời hạn
            </div>
          </div>
        </div>

        {/* 2. Option Habit */}
        <div
          onClick={() => setItemType('habit')}
          style={{
            background: itemType === 'habit' ? 'var(--lq-success-soft)' : '#FFFFFF',
            border: itemType === 'habit' ? '2px solid var(--lq-success)' : '1px solid var(--lq-border)',
            borderRadius: 18,
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'var(--lq-success)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Repeat size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <b style={{ fontSize: 14, color: 'var(--lq-ink)' }}>Habit</b>
            <div style={{ fontSize: 11.5, color: 'var(--lq-ink-muted)' }}>
              Thói quen lặp lại mỗi ngày
            </div>
          </div>
        </div>

        {/* 3. Option Quest */}
        <div
          onClick={() => setItemType('quest')}
          style={{
            background: itemType === 'quest' ? 'rgba(22, 50, 74, 0.08)' : '#FFFFFF',
            border: itemType === 'quest' ? '2px solid var(--lq-primary)' : '1px solid var(--lq-border)',
            borderRadius: 18,
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'var(--lq-primary)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <MapPin size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <b style={{ fontSize: 14, color: 'var(--lq-ink)' }}>Quest</b>
            <div style={{ fontSize: 11.5, color: 'var(--lq-ink-muted)' }}>
              Hành trình dài với các cột mốc
            </div>
          </div>
        </div>

        {/* Title Input */}
        <div style={{
          height: 50,
          borderRadius: 16,
          background: '#FFFFFF',
          border: '2px solid #E8DCCB',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          marginTop: 2
        }}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder={itemType === 'task' ? 'Tên nhiệm vụ…' : itemType === 'habit' ? 'Tên thói quen…' : 'Tên mục tiêu quest…'}
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              width: '100%',
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--lq-ink)'
            }}
            autoFocus
          />
        </div>

        {/* Create Button */}
        <button
          onClick={handleCreate}
          style={{
            height: 52,
            borderRadius: 16,
            background: 'var(--lq-accent)',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: 15,
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 0 #C4491F',
            letterSpacing: '0.4px',
            textTransform: 'uppercase',
            cursor: 'pointer',
            marginTop: 4
          }}
        >
          Tạo ngay
        </button>
      </div>
    </div>
  )
}
export default CreateSheetModal
