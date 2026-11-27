import React from 'react'

interface LoadingScreenProps {
  onFinish?: () => void
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onFinish }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100%',
      padding: '40px 24px',
      textAlign: 'center',
      gap: 20
    }}>
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <img
          src="/assets/fox/fox-cp2-anim.webp"
          alt="Fox Running"
          style={{ width: 220, height: 'auto', objectFit: 'contain' }}
          onError={(e) => {
            // fallback to png
            ;(e.target as HTMLImageElement).src = '/assets/fox/fox-cp2.png'
          }}
        />
      </div>

      <div style={{
        fontSize: 28,
        fontWeight: 800,
        color: 'var(--lq-primary)',
        letterSpacing: '-0.5px'
      }}>
        LifeQuest
      </div>

      <div style={{
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--lq-ink-muted)',
        maxWidth: 240
      }}>
        Fox đang chuẩn bị hành trình của bạn…
      </div>

      {/* Progress Bar */}
      <div style={{
        width: 220,
        height: 10,
        borderRadius: 99,
        background: 'var(--lq-surface-subtle)',
        overflow: 'hidden',
        position: 'relative',
        marginTop: 6
      }}>
        <div style={{
          height: '100%',
          width: '68%',
          borderRadius: 99,
          background: 'var(--lq-accent)',
          transition: 'width 0.4s ease'
        }} />
      </div>

      {onFinish && (
        <button
          onClick={onFinish}
          style={{
            marginTop: 20,
            border: 'none',
            background: 'var(--lq-accent-soft)',
            color: 'var(--lq-accent)',
            fontSize: 12,
            fontWeight: 700,
            padding: '6px 14px',
            borderRadius: 16,
            cursor: 'pointer'
          }}
        >
          Bỏ qua tải trang →
        </button>
      )}
    </div>
  )
}
export default LoadingScreen
