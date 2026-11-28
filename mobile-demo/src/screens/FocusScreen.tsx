import React, { useState, useEffect } from 'react'
import { X, Pause, Play, Check } from 'lucide-react'
import confetti from 'canvas-confetti'

interface FocusScreenProps {
  onClose?: () => void
  taskTitle?: string
}

export const FocusScreen: React.FC<FocusScreenProps> = ({
  onClose,
  taskTitle = 'Ôn Chương 3 – Giải tích'
}) => {
  const TOTAL_SECONDS = 25 * 60
  const [secondsLeft, setSecondsLeft] = useState(15 * 60 + 42) // 15:42 default like screenshot
  const [isActive, setIsActive] = useState(true)
  const [isCompleted, setIsCompleted] = useState(false)

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((sec) => sec - 1)
      }, 1000)
    } else if (secondsLeft === 0) {
      setIsActive(false)
      setIsCompleted(true)
      confetti({ particleCount: 80, spread: 70 })
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, secondsLeft])

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  // Calculate percentage for conic gradient
  const progressPercent = Math.round(((TOTAL_SECONDS - secondsLeft) / TOTAL_SECONDS) * 100)

  const handleComplete = () => {
    setIsActive(false)
    setIsCompleted(true)
    confetti({ particleCount: 100, spread: 80 })
  }

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
        <button
          onClick={onClose}
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
          <X size={18} />
        </button>

        <span style={{
          fontSize: 11,
          fontWeight: 800,
          padding: '4px 10px',
          borderRadius: 99,
          background: 'var(--lq-success-soft)',
          color: 'var(--lq-success)'
        }}>
          {isCompleted ? '✓ Hoàn thành phiên' : 'Đang tập trung'}
        </span>

        <div style={{ width: 38 }} />
      </div>

      {/* Main Focus Area */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
        marginTop: 6
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--lq-ink-muted)' }}>
          {taskTitle}
        </div>

        {/* Circular Timer Ring */}
        <div style={{
          width: 236,
          height: 236,
          borderRadius: '50%',
          background: `conic-gradient(var(--lq-accent) 0 ${progressPercent}%, var(--lq-surface-subtle) 0)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(242, 107, 58, 0.15)'
        }}>
          <div style={{
            width: 202,
            height: 202,
            borderRadius: '50%',
            background: 'var(--lq-bg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              fontSize: 52,
              fontWeight: 800,
              letterSpacing: '-2px',
              color: 'var(--lq-ink)',
              lineHeight: 1
            }}>
              {timeFormatted}
            </div>
            <span style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--lq-ink-muted)',
              marginTop: 4
            }}>
              còn lại / 25:00
            </span>
          </div>
        </div>

        {/* Mascot Sitting Fox with Speech Bubble */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          marginTop: 6
        }}>
          <img
            src="/assets/fox/fox-cp1-anim.webp"
            alt="Fox Sitting"
            style={{ width: 145, height: 'auto', objectFit: 'contain' }}
            onError={(e) => {
              ;(e.target as HTMLImageElement).src = '/assets/fox/fox-cp1.png'
            }}
          />

          <div style={{
            background: '#FFFFFF',
            borderRadius: 18,
            padding: '10px 16px',
            boxShadow: 'var(--shadow-f)',
            fontWeight: 700,
            fontSize: 13,
            border: '1px solid var(--lq-border)',
            color: 'var(--lq-ink)'
          }}>
            {isCompleted ? 'Tuyệt vời! Bạn đã hoàn thành phiên tập trung!' : 'Fox ngồi học cùng bạn nhé!'}
          </div>
        </div>
      </div>

      {/* Bottom Buttons */}
      <div style={{ marginTop: 'auto', display: 'flex', gap: 10 }}>
        <button
          onClick={() => setIsActive(!isActive)}
          style={{
            flex: 1,
            height: 52,
            borderRadius: 16,
            background: '#FFFFFF',
            color: 'var(--lq-accent)',
            fontWeight: 800,
            fontSize: 14,
            border: '1px solid var(--lq-border)',
            boxShadow: '0 3px 0 var(--lq-surface-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            cursor: 'pointer'
          }}
        >
          {isActive ? <Pause size={18} /> : <Play size={18} />}
          <span>{isActive ? 'Tạm dừng' : 'Tiếp tục'}</span>
        </button>

        <button
          onClick={handleComplete}
          style={{
            flex: 1,
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
            gap: 6,
            cursor: 'pointer'
          }}
        >
          <Check size={18} strokeWidth={3} />
          <span>Hoàn thành</span>
        </button>
      </div>
    </div>
  )
}
export default FocusScreen
