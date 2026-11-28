import React, { useState } from 'react'
import { ArrowLeft, Clock, Plus, CheckCircle2 } from 'lucide-react'

interface TaskDetailScreenProps {
  onBack: () => void
  onStartFocus: () => void
}

export const TaskDetailScreen: React.FC<TaskDetailScreenProps> = ({
  onBack,
  onStartFocus
}) => {
  const [isCompleted, setIsCompleted] = useState(false)
  const [hasPhoto, setHasPhoto] = useState(false)

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100%',
      padding: '12px 16px 24px',
      gap: 14
    }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={onBack}
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: '#FFFFFF',
              border: '1px solid var(--lq-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--lq-ink)'
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--lq-ink)' }}>
            Chi tiết nhiệm vụ
          </div>
        </div>
      </div>

      {/* Main Task Info Card */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 22,
        padding: '16px',
        border: '1px solid var(--lq-border)',
        boxShadow: 'var(--shadow)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontSize: 11,
            fontWeight: 800,
            padding: '3px 8px',
            borderRadius: 99,
            background: 'var(--lq-danger-soft)',
            color: 'var(--lq-danger)'
          }}>
            Ưu tiên cao
          </span>

          <span style={{
            fontSize: 11,
            fontWeight: 800,
            padding: '3px 8px',
            borderRadius: 99,
            background: 'var(--lq-accent-soft)',
            color: 'var(--lq-accent)'
          }}>
            +60 XP
          </span>
        </div>

        <div style={{
          fontSize: 21,
          fontWeight: 800,
          color: 'var(--lq-ink)',
          textDecoration: isCompleted ? 'line-through' : 'none'
        }}>
          Ôn Chương 3 – Giải tích
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--lq-ink-muted)'
        }}>
          <Clock size={15} />
          <span>Hôm nay · 19:00 – 20:00</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700 }}>
            <span>Tiến độ</span>
            <span style={{ color: 'var(--lq-ink-muted)' }}>{isCompleted ? '100%' : '50%'}</span>
          </div>
          <div style={{
            height: 10,
            borderRadius: 99,
            background: 'var(--lq-surface-subtle)',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: isCompleted ? '100%' : '50%',
              borderRadius: 99,
              background: 'var(--lq-success)',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      </div>

      {/* Target Milestone & Proof Photo Card */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 22,
        padding: '16px',
        border: '1px solid var(--lq-border)',
        boxShadow: 'var(--shadow)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--lq-ink)' }}>
          Đích đến (Hạn chót)
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Thi cuối kỳ</span>
          <span style={{
            fontSize: 11,
            fontWeight: 800,
            padding: '3px 8px',
            borderRadius: 99,
            background: 'rgba(22, 50, 74, 0.08)',
            color: 'var(--lq-ink-secondary)'
          }}>
            T6, 5/12
          </span>
        </div>

        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--lq-ink)', marginTop: 4 }}>
          Ảnh minh chứng
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            onClick={() => setHasPhoto(!hasPhoto)}
            style={{
              width: 84,
              height: 84,
              borderRadius: 14,
              background: hasPhoto ? '#E8F5E9' : 'var(--lq-surface-subtle)',
              border: hasPhoto ? '2px solid var(--lq-success)' : '1px dashed var(--lq-border)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: hasPhoto ? 'var(--lq-success)' : 'var(--lq-ink-muted)'
            }}
          >
            {hasPhoto ? (
              <CheckCircle2 size={28} />
            ) : (
              <Plus size={28} />
            )}
            <span style={{ fontSize: 10, fontWeight: 700, marginTop: 4 }}>
              {hasPhoto ? 'Đã tải ảnh' : 'Tải ảnh'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={onStartFocus}
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
            cursor: 'pointer'
          }}
        >
          Bắt đầu tập trung
        </button>

        <button
          onClick={() => setIsCompleted(!isCompleted)}
          style={{
            height: 50,
            borderRadius: 16,
            background: '#FFFFFF',
            color: isCompleted ? 'var(--lq-success)' : 'var(--lq-accent)',
            fontWeight: 700,
            fontSize: 14,
            border: '1px solid var(--lq-border)',
            boxShadow: '0 3px 0 var(--lq-surface-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          {isCompleted ? '✓ Đã hoàn thành' : 'Đánh dấu hoàn thành'}
        </button>
      </div>
    </div>
  )
}
export default TaskDetailScreen
