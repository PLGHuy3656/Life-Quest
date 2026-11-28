import React, { useState } from 'react'
import { X, Eye, EyeOff } from 'lucide-react'

interface LoginScreenProps {
  onLoginSuccess: () => void
  onGoToRegister: () => void
  onClose: () => void
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onGoToRegister,
  onClose
}) => {
  const [email, setEmail] = useState('minhanh@lifequest.app')
  const [password, setPassword] = useState('lifequest123')
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100%',
      padding: '16px 20px 24px',
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

        <button
          onClick={onGoToRegister}
          style={{
            border: 'none',
            background: 'var(--lq-accent-soft)',
            color: 'var(--lq-accent)',
            fontSize: 12,
            fontWeight: 800,
            padding: '6px 14px',
            borderRadius: 20,
            cursor: 'pointer'
          }}
        >
          ĐĂNG KÝ
        </button>
      </div>

      {/* Fox Avatar */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: 16,
        gap: 6
      }}>
        <img
          src="/assets/fox/fox-cp3-center-anim.webp"
          alt="Fox Idle"
          style={{ width: 125, height: 'auto', objectFit: 'contain' }}
          onError={(e) => {
            ;(e.target as HTMLImageElement).src = '/assets/fox/fox-cp3-center.png'
          }}
        />
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--lq-ink-muted)' }}>
          Cùng Fox tiếp tục hành trình nhé
        </div>
      </div>

      <div style={{
        fontSize: 26,
        fontWeight: 800,
        textAlign: 'center',
        color: 'var(--lq-ink)',
        marginTop: 6
      }}>
        Đăng nhập
      </div>

      {/* Input Fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
        <div style={{
          height: 52,
          borderRadius: 16,
          background: '#FFFFFF',
          border: '2px solid #E8DCCB',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center'
        }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              width: '100%',
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--lq-ink)'
            }}
          />
        </div>

        <div style={{
          height: 52,
          borderRadius: 16,
          background: '#FFFFFF',
          border: '2px solid #E8DCCB',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mật khẩu"
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              flex: 1,
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--lq-ink)'
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--lq-ink-secondary)', cursor: 'pointer' }}>
              QUÊN?
            </span>
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              style={{ background: 'transparent', border: 'none', padding: 2, display: 'flex', color: 'var(--lq-ink-muted)', cursor: 'pointer' }}
              aria-label="Hiện/ẩn mật khẩu"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Login Button */}
      <button
        onClick={onLoginSuccess}
        style={{
          marginTop: 10,
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
        Đăng nhập
      </button>

      <div style={{
        fontSize: 11.5,
        color: 'var(--lq-ink-muted)',
        textAlign: 'center',
        marginTop: 'auto',
        lineHeight: 1.4
      }}>
        Phiên đăng nhập demo được lưu sẵn trong bộ nhớ trình duyệt.
      </div>
    </div>
  )
}
export default LoginScreen
