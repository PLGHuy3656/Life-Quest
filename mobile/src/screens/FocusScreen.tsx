import React, { useState, useEffect } from 'react'
import { useStore } from '../store/questStore'
import { Play, Pause, RotateCcw, Volume2, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react'

export const FocusScreen: React.FC = () => {
  const { fox, quests, recordFocusSession } = useStore()

  const [selectedDuration, setSelectedDuration] = useState<number>(25)
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60)
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [selectedQuestId, setSelectedQuestId] = useState<string>('')
  const [soundMode, setSoundMode] = useState<string>('rain')

  // Timer tick
  useEffect(() => {
    let timer: any = null
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
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

  const handleTogglePlay = () => {
    setIsRunning(!isRunning)
  }

  const handleReset = () => {
    setIsRunning(false)
    setTimeLeft(selectedDuration * 60)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const progressPercent = ((selectedDuration * 60 - timeLeft) / (selectedDuration * 60)) * 100

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: '16px', alignItems: 'center' }}>
      {/* Header Info */}
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)' }}>
          Đấu Trường Tập Trung
        </h2>
        <p style={{ fontSize: 13, color: 'var(--ink-secondary)', marginTop: 4 }}>
          Kích hoạt dòng chảy Pomodoro & nhận thưởng XP
        </p>
      </div>

      {/* Mode / Time Pills */}
      <div style={{
        display: 'flex',
        gap: 8,
        background: 'var(--bg-subtle)',
        padding: 4,
        borderRadius: 14
      }}>
        {[
          { mins: 25, label: '25 phút (Tiêu chuẩn)' },
          { mins: 50, label: '50 phút (Sâu)' },
          { mins: 5, label: '5 phút (Nghỉ ngắn)' }
        ].map((item) => (
          <button
            key={item.mins}
            onClick={() => handleSelectDuration(item.mins)}
            disabled={isRunning}
            style={{
              padding: '8px 12px',
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 700,
              background: selectedDuration === item.mins ? '#FFFFFF' : 'transparent',
              color: selectedDuration === item.mins ? 'var(--primary)' : 'var(--ink-secondary)',
              boxShadow: selectedDuration === item.mins ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              opacity: isRunning && selectedDuration !== item.mins ? 0.5 : 1
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Circular Timer Visual */}
      <div style={{
        position: 'relative',
        width: 230,
        height: 230,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(145deg, #FAF9F6 0%, #FFFFFF 100%)',
        borderRadius: '50%',
        boxShadow: isRunning ? 'var(--shadow-float)' : 'var(--shadow-md)',
        border: '6px solid var(--border)',
        margin: '10px 0',
        transition: 'box-shadow 0.3s ease'
      }}>
        {/* Progress ring svg */}
        <svg
          style={{
            position: 'absolute',
            inset: -6,
            width: 242,
            height: 242,
            transform: 'rotate(-90deg)',
            pointerEvents: 'none'
          }}
        >
          <circle
            cx="121"
            cy="121"
            r="112"
            stroke="var(--accent)"
            strokeWidth="7"
            fill="none"
            strokeDasharray={2 * Math.PI * 112}
            strokeDashoffset={2 * Math.PI * 112 * (1 - progressPercent / 100)}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>

        {/* Mascot state */}
        <div className={isRunning ? 'animate-mascot' : ''} style={{ fontSize: 32, marginBottom: 4 }}>
          {isRunning ? '🦊🔥' : '🦊💤'}
        </div>

        {/* Time Digits */}
        <div style={{
          fontSize: 44,
          fontWeight: 800,
          color: 'var(--ink)',
          letterSpacing: '-1px',
          fontVariantNumeric: 'tabular-nums'
        }}>
          {formatTime(timeLeft)}
        </div>

        <div style={{
          fontSize: 12,
          fontWeight: 700,
          color: isRunning ? 'var(--accent)' : 'var(--ink-secondary)',
          marginTop: 2
        }}>
          {isRunning ? 'Đang tập trung cao độ...' : 'Sẵn sàng chinh phục'}
        </div>
      </div>

      {/* Control Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          onClick={handleReset}
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            background: 'var(--bg-subtle)',
            color: 'var(--ink-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border)'
          }}
          title="Đặt lại thời gian"
        >
          <RotateCcw size={20} />
        </button>

        <button
          onClick={handleTogglePlay}
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            background: isRunning
              ? 'var(--primary)'
              : 'linear-gradient(135deg, #F26B3A 0%, #DE5A2A 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isRunning ? 'var(--shadow-md)' : 'var(--shadow-float)'
          }}
          title={isRunning ? 'Tạm dừng' : 'Bắt đầu'}
        >
          {isRunning ? (
            <Pause size={28} fill="#FFFFFF" color="#FFFFFF" />
          ) : (
            <Play size={28} fill="#FFFFFF" color="#FFFFFF" style={{ marginLeft: 3 }} />
          )}
        </button>

        <div style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          background: 'var(--gold-soft)',
          color: 'var(--gold-text)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 800,
          border: '1px solid rgba(246, 200, 95, 0.4)'
        }}>
          <span>+{selectedDuration * 5}</span>
          <span style={{ fontSize: 9 }}>XP</span>
        </div>
      </div>

      {/* Ambient Sound Mode */}
      <div className="card" style={{ width: '100%', padding: '14px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink)' }}>
            <Volume2 size={16} color="var(--primary)" />
            <span>Âm thanh nền hỗ trợ tập trung</span>
          </div>
          <span className="badge badge-success" style={{ fontSize: 10 }}>Stereo</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {[
            { id: 'rain', label: '🌧️ Mưa rào' },
            { id: 'forest', label: '🌲 Rừng sâu' },
            { id: 'cafe', label: '☕ Quán Cafe' },
            { id: 'white', label: '🌊 Sóng biển' }
          ].map((snd) => (
            <button
              key={snd.id}
              onClick={() => setSoundMode(snd.id)}
              style={{
                padding: '8px 4px',
                borderRadius: 10,
                fontSize: 11,
                fontWeight: 600,
                background: soundMode === snd.id ? 'var(--primary-soft)' : 'var(--bg-subtle)',
                color: soundMode === snd.id ? 'var(--primary)' : 'var(--ink-secondary)',
                border: '1px solid',
                borderColor: soundMode === snd.id ? 'var(--primary)' : 'transparent',
                textAlign: 'center'
              }}
            >
              {snd.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quest Link */}
      <div className="card" style={{ width: '100%', padding: '14px', background: '#FFFFFF' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
          Gắn kèm với nhiệm vụ:
        </div>
        <select
          value={selectedQuestId}
          onChange={(e) => setSelectedQuestId(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'var(--bg-elevated)',
            fontSize: 13,
            outline: 'none',
            fontFamily: 'inherit',
            color: 'var(--ink)'
          }}
        >
          <option value="">-- Tự do (Không gắn nhiệm vụ cụ thể) --</option>
          {quests
            .filter((q) => !q.completed)
            .map((q) => (
              <option key={q.id} value={q.id}>
                {q.title} (+{q.xpReward} XP)
              </option>
            ))}
        </select>
      </div>
    </div>
  )
}
