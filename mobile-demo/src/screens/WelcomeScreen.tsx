import React from 'react'

interface WelcomeScreenProps {
  onStart: () => void
  onLogin: () => void
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart, onLogin }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100%',
      padding: '16px 20px 24px',
      justifyContent: 'space-between'
    }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'var(--lq-primary)',
            color: 'var(--lq-reward)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: 14
          }}>
            LQ
          </div>
          <b style={{ fontSize: 16, color: 'var(--lq-ink)' }}>LifeQuest</b>
        </div>

        <button
          onClick={onLogin}
          style={{
            border: 'none',
            background: 'var(--lq-accent-soft)',
            color: 'var(--lq-accent)',
            fontSize: 11.5,
            fontWeight: 800,
            padding: '5px 12px',
            borderRadius: 20,
            cursor: 'pointer'
          }}
        >
          ĐĂNG NHẬP
        </button>
      </div>

      {/* Hero Mascot & Intro */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 14,
        margin: 'auto 0',
        padding: '20px 0'
      }}>
        <img
          src="/assets/fox/fox-cta-summit-anim.webp"
          alt="Fox Summit"
          style={{ width: 240, height: 'auto', objectFit: 'contain' }}
          onError={(e) => {
            ;(e.target as HTMLImageElement).src = '/assets/fox/fox-cta-summit.png'
          }}
        />

        <div style={{
          fontSize: 27,
          fontWeight: 800,
          color: 'var(--lq-ink)',
          lineHeight: 1.25,
          letterSpacing: '-0.5px'
        }}>
          Biến mục tiêu thành<br />hành trình cùng Fox
        </div>

        <div style={{
          fontSize: 13.5,
          color: 'var(--lq-ink-secondary)',
          lineHeight: 1.5,
          maxWidth: 300
        }}>
          Hoàn thành nhiệm vụ, giữ chuỗi ngày, mở khoá trang phục cho bạn đồng hành Kitsu.
        </div>
      </div>

      {/* Bottom CTA Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={onStart}
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
          Bắt đầu
        </button>

        <button
          onClick={onLogin}
          style={{
            height: 50,
            borderRadius: 16,
            background: '#FFFFFF',
            color: 'var(--lq-accent)',
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
          Tôi đã có tài khoản
        </button>
      </div>
    </div>
  )
}
export default WelcomeScreen
