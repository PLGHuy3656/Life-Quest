import React, { useState, useEffect } from 'react'
import { useStore } from '../store/questStore'
import { Play, Pause, RotateCcw, Volume2, Sparkles, Zap, Award } from 'lucide-react'

export const FocusScreen: React.FC = () => {
  const { tasks, recordFocusSession } = useStore()
  const [selectedDuration, setSelectedDuration] = useState<number>(25)
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60)
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [soundMode, setSoundMode] = useState<string>('rain')

  useEffect(() => {
    let timer: any = null
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000)
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false)
      recordFocusSession(selectedDuration)
    }

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [isRunning, timeLeft, selectedDuration])

  const handleSelectDuration = (mins: number) => {
    if (isRunning) return
    setSelectedDuration(mins)
    setTimeLeft(mins * 60)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const progressPercent = ((selectedDuration * 60 - timeLeft) / (selectedDuration * 60)) * 100

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '16px', alignItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--lq-ink)' }}>
          Đấu Trường Tập Trung (Pomodoro)
        </h2>
        <p style={{ fontSize: 12, color: 'var(--lq-ink-muted)', marginTop: 2 }}>
          Luyện dòng chảy tập trung & nhận thưởng XP
        </p>
      </div>

      {/* Mode / Time Pills */}
      <div style={{ display: 'flex', gap: 6, background: 'var(--lq-surface-subtle)', padding: 4, borderRadius: 12 }}>
        {[
          { mins: 25, label: '25p (Chuẩn)' },
          { mins: 50, label: '50p (Sâu)' },
          { mins: 5, label: '5p (Nghỉ)' }
        ].map((m) => (
          <button
            key={m.mins}
            onClick={() => handleSelectDuration(m.mins)}
            disabled={isRunning}
            style={{
              padding: '7px 12px',
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 700,
              background: selectedDuration === m.mins ? 'var(--lq-surface)' : 'transparent',
              color: selectedDuration === m.mins ? 'var(--lq-ink)' : 'var(--lq-ink-muted)',
              boxShadow: selectedDuration === m.mins ? 'var(--shadow-sm)' : 'none',
              opacity: isRunning && selectedDuration !== m.mins ? 0.4 : 1
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Circular Progress Timer */}
      <div style={{
        position: 'relative',
        width: 220,
        height: 220,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--lq-surface)',
        borderRadius: '50%',
        boxShadow: isRunning ? 'var(--shadow-float)' : 'var(--shadow-card)',
        border: '6px solid var(--lq-border)',
        margin: '6px 0'
      }}>
        <svg style={{
          position: 'absolute',
          inset: -6,
          width: 232,
          height: 232,
          transform: 'rotate(-90deg)',
          pointerEvents: 'none'
        }}>
          <circle
            cx="116"
            cy="116"
            r="107"
            stroke="var(--lq-accent)"
            strokeWidth="7"
            fill="none"
            strokeDasharray={2 * Math.PI * 107}
            strokeDashoffset={2 * Math.PI * 107 * (1 - progressPercent / 100)}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>

        <div className={isRunning ? 'animate-mascot' : ''} style={{ fontSize: 32, marginBottom: 4 }}>
          {isRunning ? '🦊🔥' : '🦊💤'}
        </div>

        <div style={{
          fontSize: 42,
          fontWeight: 800,
          color: 'var(--lq-ink)',
          letterSpacing: '-1px',
          fontVariantNumeric: 'tabular-nums'
        }}>
          {formatTime(timeLeft)}
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, color: isRunning ? 'var(--lq-accent)' : 'var(--lq-ink-muted)' }}>
          {isRunning ? 'Đang tập trung cao độ...' : 'Sẵn sàng kích hoạt'}
        </div>
      </div>

      {/* Control Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          onClick={() => {
            setIsRunning(false)
            setTimeLeft(selectedDuration * 60)
          }}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            background: 'var(--lq-surface)',
            color: 'var(--lq-ink-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--lq-border)'
          }}
          title="Đặt lại"
        >
          <RotateCcw size={18} />
        </button>

        <button
          onClick={() => setIsRunning(!isRunning)}
          style={{
            width: 68,
            height: 68,
            borderRadius: 34,
            background: isRunning
              ? 'var(--lq-primary)'
              : 'linear-gradient(135deg, #F26B3A 0%, #DE5A2A 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isRunning ? 'var(--shadow-card)' : 'var(--shadow-accent)'
          }}
        >
          {isRunning ? (
            <Pause size={26} fill="#FFFFFF" />
          ) : (
            <Play size={26} fill="#FFFFFF" style={{ marginLeft: 3 }} />
          )}
        </button>

        <div style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          background: 'var(--lq-reward-soft)',
          color: 'var(--lq-reward-ink)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          fontWeight: 800
        }}>
          <span>+{selectedDuration * 5}</span>
          <span style={{ fontSize: 8 }}>XP</span>
        </div>
      </div>

      {/* Ambient Sound Mode */}
      <div className="card" style={{ width: '100%', padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--lq-ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Volume2 size={15} color="var(--lq-primary)" />
            <span>Âm thanh nền tập trung</span>
          </div>
          <span style={{ fontSize: 10, color: 'var(--lq-success)', fontWeight: 700 }}>Đang bật</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {[
            { id: 'rain', label: '🌧️ Mưa' },
            { id: 'forest', label: '🌲 Rừng' },
            { id: 'cafe', label: '☕ Cafe' },
            { id: 'white', label: '🌊 Sóng' }
          ].map((snd) => (
            <button
              key={snd.id}
              onClick={() => setSoundMode(snd.id)}
              style={{
                padding: '7px 4px',
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 600,
                background: soundMode === snd.id ? 'var(--lq-primary-soft)' : 'var(--lq-surface-subtle)',
                color: soundMode === snd.id ? 'var(--lq-primary)' : 'var(--lq-ink-muted)',
                border: '1px solid',
                borderColor: soundMode === snd.id ? 'var(--lq-primary)' : 'transparent'
              }}
            >
              {snd.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
