import React from 'react'
import { ArrowLeft, Flag } from 'lucide-react'

interface QuestDetailScreenProps {
  onBack: () => void
}

export const QuestDetailScreen: React.FC<QuestDetailScreenProps> = ({ onBack }) => {
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
        gap: 10
      }}>
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

        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--lq-ink)' }}>
          Quest
        </div>
      </div>

      {/* Hero Quest Card */}
      <div style={{
        background: 'linear-gradient(135deg, #16324A, #1E7F8C)',
        color: '#FFFFFF',
        borderRadius: 22,
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        boxShadow: 'var(--shadow)'
      }}>
        <span style={{
          background: 'rgba(255, 255, 255, 0.2)',
          fontSize: 11,
          fontWeight: 800,
          padding: '3px 8px',
          borderRadius: 99,
          width: 'fit-content'
        }}>
          Học tập
        </span>

        <div style={{ fontSize: 21, fontWeight: 800 }}>
          Chinh phục kỳ thi cuối kỳ
        </div>

        <div style={{
          height: 8,
          borderRadius: 99,
          background: 'rgba(255, 255, 255, 0.2)',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: '72%',
            background: 'var(--lq-reward)',
            borderRadius: 99
          }} />
        </div>

        <span style={{ fontSize: 12, opacity: 0.9 }}>
          72% · còn 8 ngày
        </span>
      </div>

      <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--lq-ink)' }}>
        Bản đồ cột mốc
      </div>

      {/* Milestone Roadmap Card */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 22,
        border: '1px solid var(--lq-border)',
        boxShadow: 'var(--shadow)',
        position: 'relative',
        padding: '20px 20px 20px 64px'
      }}>
        {/* Background vertical line */}
        <div style={{
          position: 'absolute',
          left: 34,
          top: 34,
          bottom: 34,
          width: 4,
          background: 'var(--lq-surface-subtle)',
          borderRadius: 9
        }} />

        {/* Completed green vertical line */}
        <div style={{
          position: 'absolute',
          left: 34,
          top: 34,
          height: '56%',
          width: 4,
          background: 'var(--lq-success)',
          borderRadius: 9
        }} />

        {/* Milestone Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'relative' }}>
          {/* Step 1 */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <div style={{
              position: 'absolute',
              left: -48,
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'var(--lq-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}>
              <Flag size={14} />
            </div>
            <b style={{ fontSize: 14, color: 'var(--lq-ink)' }}>Chặng 1: Ôn tập cốt lõi</b>
          </div>

          {/* Step 2 */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <div style={{
              position: 'absolute',
              left: -48,
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'var(--lq-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}>
              <Flag size={14} />
            </div>
            <b style={{ fontSize: 14, color: 'var(--lq-ink)' }}>Chặng 2: Giải 5 đề thi thử</b>
          </div>

          {/* Step 3 */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <div style={{
              position: 'absolute',
              left: -48,
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: '#FFFFFF',
              border: '3px solid var(--lq-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }} />
            <b style={{ fontSize: 14, color: 'var(--lq-ink)' }}>Chặng 3: Thi thử cùng nhóm</b>
          </div>

          {/* Step 4 */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <div style={{
              position: 'absolute',
              left: -48,
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: '#FFFFFF',
              border: '3px solid var(--lq-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }} />
            <b style={{ fontSize: 14, color: 'var(--lq-ink)' }}>Chặng 4: Về đích điểm A</b>
          </div>
        </div>

        {/* Fox Corner Mascot */}
        <div style={{ position: 'absolute', right: 8, bottom: 6 }}>
          <img
            src="/assets/fox/fox-cp4-anim.webp"
            alt="Fox Milestone"
            style={{ width: 75, height: 'auto', objectFit: 'contain' }}
            onError={(e) => {
              ;(e.target as HTMLImageElement).src = '/assets/fox/fox-cp4.png'
            }}
          />
        </div>
      </div>

      {/* Next Task Recommendation Card */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 20,
        padding: '14px 16px',
        border: '1px solid var(--lq-border)',
        boxShadow: 'var(--shadow)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--lq-ink-muted)' }}>
            Nhiệm vụ tiếp theo
          </span>
          <b style={{ fontSize: 14, color: 'var(--lq-ink)' }}>Làm đề ôn tập số 2</b>
        </div>

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
    </div>
  )
}
export default QuestDetailScreen
