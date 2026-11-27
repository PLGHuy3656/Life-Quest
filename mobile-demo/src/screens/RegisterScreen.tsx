import React, { useState } from 'react'
import { ArrowLeft, Check } from 'lucide-react'

interface RegisterScreenProps {
  onComplete: () => void
  onBack: () => void
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onComplete, onBack }) => {
  const [selectedDuration, setSelectedDuration] = useState('15 phút / ngày')

  const durations = [
    '5 phút / ngày',
    '15 phút / ngày',
    '30 phút / ngày',
    '60+ phút / ngày'
  ]

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100%',
      padding: '16px 20px 24px',
      gap: 14
    }}>
      {/* Top Header & Progress */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
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

        {/* Progress Bar 2/4 */}
        <div style={{
          flex: 1,
          height: 10,
          borderRadius: 99,
          background: 'var(--lq-surface-subtle)',
          margin: '0 14px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: '50%',
            borderRadius: 99,
            background: 'var(--lq-accent)'
          }} />
        </div>

        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--lq-ink-muted)' }}>
          2/4
        </span>
      </div>

      {/* Mascot Question Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 10,
        margin: '10px 0 4px'
      }}>
        <img
          src="/assets/fox/fox-mood-cheer-anim.webp"
          alt="Fox Cheer"
          style={{ width: 100, height: 'auto', objectFit: 'contain' }}
          onError={(e) => {
            ;(e.target as HTMLImageElement).src = '/assets/fox/fox-mood-cheer.png'
          }}
        />

        <div style={{
          background: '#FFFFFF',
          borderRadius: 18,
          padding: '10px 14px',
          boxShadow: 'var(--shadow-f)',
          fontWeight: 700,
          fontSize: 13,
          border: '1px solid var(--lq-border)',
          lineHeight: 1.4,
          flex: 1
        }}>
          Mỗi ngày bạn muốn dành bao lâu cho mục tiêu?
        </div>
      </div>

      <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--lq-ink)' }}>
        Nhịp độ của bạn
      </div>

      {/* Options List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {durations.map((dur) => {
          const isSelected = selectedDuration === dur
          return (
            <div
              key={dur}
              onClick={() => setSelectedDuration(dur)}
              style={{
                background: '#FFFFFF',
                borderRadius: 18,
                padding: '14px 16px',
                border: isSelected ? '2px solid var(--lq-accent)' : '1px solid var(--lq-border)',
                backgroundColor: isSelected ? 'var(--lq-accent-soft)' : '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <b style={{ fontSize: 14, color: 'var(--lq-ink)' }}>{dur}</b>

              <div style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                border: isSelected ? 'none' : '2px solid var(--lq-border)',
                background: isSelected ? 'var(--lq-accent)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF'
              }}>
                {isSelected && <Check size={14} strokeWidth={3} />}
              </div>
            </div>
          )
        })}
      </div>

      {/* Continue Button */}
      <div style={{ marginTop: 'auto', paddingTop: 16 }}>
        <button
          onClick={onComplete}
          style={{
            height: 52,
            width: '100%',
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
          Tiếp tục
        </button>
      </div>
    </div>
  )
}
export default RegisterScreen
