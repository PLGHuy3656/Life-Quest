import React, { useState } from 'react'
import { ArrowLeft, Check, Eye, EyeOff, Mail, Lock, User, ShieldCheck, Sparkles } from 'lucide-react'

interface RegisterScreenProps {
  onComplete: () => void
  onBack: () => void
  onGoToLogin?: () => void
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onComplete,
  onBack,
  onGoToLogin
}) => {
  // Step 1: Account Registration Form | Step 2: Daily Pace Onboarding
  const [step, setStep] = useState<1 | 2>(1)

  // Form states
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  // Step 2 state
  const [selectedDuration, setSelectedDuration] = useState('15 phút / ngày')

  const durations = [
    { label: '5 phút / ngày', desc: 'Nhẹ nhàng, dễ duy trì thói quen' },
    { label: '15 phút / ngày', desc: 'Cân bằng hoàn hảo · Fox khuyên dùng' },
    { label: '30 phút / ngày', desc: 'Tăng tốc hoàn thành đại nhiệm vụ' },
    { label: '60+ phút / ngày', desc: 'Chế độ chiến binh tập trung cao độ' }
  ]

  // Password strength helper
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: 'transparent' }
    let score = 1
    if (pwd.length >= 6) score++
    if (/[A-Z]/.test(pwd) || /[0-9]/.test(pwd)) score++
    if (pwd.length >= 10 && /[^A-Za-z0-9]/.test(pwd)) score++

    if (score <= 1) return { score: 1, label: 'Yếu', color: '#C84032' }
    if (score === 2) return { score: 2, label: 'Trung bình', color: '#E69A28' }
    if (score === 3) return { score: 3, label: 'Khá mạnh', color: '#168C78' }
    return { score: 4, label: 'Rất mạnh', color: '#168C78' }
  }

  const strength = getPasswordStrength(password)

  const handleSubmitRegister = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!fullName.trim()) {
      setErrorMsg('Vui lòng nhập tên hiển thị của bạn.')
      return
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('Vui lòng nhập địa chỉ email hợp lệ.')
      return
    }
    if (password.length < 6) {
      setErrorMsg('Mật khẩu cần tối thiểu 6 ký tự.')
      return
    }
    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận chưa trùng khớp.')
      return
    }
    if (!agreeTerms) {
      setErrorMsg('Bạn cần đồng ý với điều khoản sử dụng để tiếp tục.')
      return
    }

    setStep(2)
  }

  const inputWrapperStyle: React.CSSProperties = {
    height: 48,
    borderRadius: 15,
    background: '#FFFFFF',
    border: '1.5px solid #E5D9C7',
    padding: '0 14px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    boxShadow: '0 2px 6px rgba(22, 50, 74, 0.03)'
  }

  const inputStyle: React.CSSProperties = {
    border: 'none',
    background: 'transparent',
    outline: 'none',
    flex: 1,
    fontSize: 13.5,
    fontWeight: 600,
    color: 'var(--lq-ink)',
    minWidth: 0
  }

  // ==================== STEP 1: REGISTRATION FORM ====================
  if (step === 1) {
    return (
      <div
        className="animate-fade-in"
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100%',
          padding: '14px 20px 26px',
          gap: 12
        }}
      >
        {/* Top Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10
          }}
        >
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
            aria-label="Quay lại"
          >
            <ArrowLeft size={18} />
          </button>

          {/* Progress Bar 1/2 */}
          <div
            style={{
              flex: 1,
              height: 8,
              borderRadius: 99,
              background: 'var(--lq-surface-subtle)',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                height: '100%',
                width: '50%',
                borderRadius: 99,
                background: 'var(--lq-accent)',
                transition: 'width 0.3s ease'
              }}
            />
          </div>

          <button
            onClick={onGoToLogin || onBack}
            style={{
              border: 'none',
              background: 'var(--lq-accent-soft)',
              color: 'var(--lq-accent)',
              fontSize: 11.5,
              fontWeight: 800,
              padding: '6px 12px',
              borderRadius: 20,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            ĐĂNG NHẬP
          </button>
        </div>

        {/* Mascot Greeting Banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginTop: 2
          }}
        >
          <img
            src="/assets/fox/fox-mood-cheer-anim.webp"
            alt="Fox Chào Mừng"
            style={{ width: 78, height: 78, objectFit: 'contain', flexShrink: 0 }}
            onError={(e) => {
              ;(e.target as HTMLImageElement).src = '/assets/fox/fox-mood-cheer.png'
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--lq-ink)', lineHeight: 1.2 }}>
              Tạo tài khoản
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--lq-ink-muted)', marginTop: 3, lineHeight: 1.35 }}>
              Đăng ký miễn phí để nhận Fox đồng hành & lưu tiến độ hành trình!
            </div>
          </div>
        </div>

        {/* Registration Form */}
        <form
          onSubmit={handleSubmitRegister}
          style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 2 }}
        >
          {/* Full Name / Character Name */}
          <div>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--lq-ink-secondary)', marginBottom: 5 }}>
              Tên hiển thị
            </label>
            <div style={inputWrapperStyle}>
              <User size={17} color="var(--lq-ink-muted)" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="VD: Minh Anh"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--lq-ink-secondary)', marginBottom: 5 }}>
              Email
            </label>
            <div style={inputWrapperStyle}>
              <Mail size={17} color="var(--lq-ink-muted)" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tenban@lifequest.app"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--lq-ink-secondary)', marginBottom: 5 }}>
              Mật khẩu
            </label>
            <div style={inputWrapperStyle}>
              <Lock size={17} color="var(--lq-ink-muted)" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                style={inputStyle}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{ background: 'transparent', border: 'none', padding: 2, display: 'flex', color: 'var(--lq-ink-muted)' }}
                aria-label="Hiện/ẩn mật khẩu"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            {/* Password Strength Bar */}
            {password.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                  {[1, 2, 3, 4].map((lvl) => (
                    <div
                      key={lvl}
                      style={{
                        flex: 1,
                        height: 4,
                        borderRadius: 99,
                        background: lvl <= strength.score ? strength.color : '#E4DDD3',
                        transition: 'background 0.2s ease'
                      }}
                    />
                  ))}
                </div>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: strength.color }}>
                  {strength.label}
                </span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--lq-ink-secondary)', marginBottom: 5 }}>
              Xác nhận mật khẩu
            </label>
            <div style={inputWrapperStyle}>
              <ShieldCheck size={17} color="var(--lq-ink-muted)" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                style={inputStyle}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                style={{ background: 'transparent', border: 'none', padding: 2, display: 'flex', color: 'var(--lq-ink-muted)' }}
                aria-label="Hiện/ẩn xác nhận mật khẩu"
              >
                {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {/* Terms Checkbox */}
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 9,
              marginTop: 2,
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            <div
              onClick={() => setAgreeTerms((v) => !v)}
              style={{
                width: 20,
                height: 20,
                borderRadius: 6,
                border: agreeTerms ? 'none' : '2px solid #C8C0B4',
                background: agreeTerms ? 'var(--lq-accent)' : '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                flexShrink: 0,
                marginTop: 1
              }}
            >
              {agreeTerms && <Check size={13} strokeWidth={3} />}
            </div>
            <span style={{ fontSize: 11.5, color: 'var(--lq-ink-secondary)', lineHeight: 1.4 }}>
              Tôi đồng ý với <b style={{ color: 'var(--lq-ink)' }}>Điều khoản sử dụng</b> và{' '}
              <b style={{ color: 'var(--lq-ink)' }}>Chính sách bảo mật</b> của LifeQuest.
            </span>
          </label>

          {/* Error Banner */}
          {errorMsg && (
            <div
              style={{
                padding: '9px 12px',
                borderRadius: 12,
                background: 'var(--lq-danger-soft)',
                color: 'var(--lq-danger)',
                fontSize: 12,
                fontWeight: 700,
                border: '1px solid rgba(200, 64, 50, 0.2)'
              }}
            >
              {errorMsg}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            style={{
              marginTop: 4,
              height: 50,
              width: '100%',
              borderRadius: 16,
              background: 'var(--lq-accent)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: 14.5,
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 0 #C4491F',
              letterSpacing: '0.4px',
              textTransform: 'uppercase',
              cursor: 'pointer'
            }}
          >
            <Sparkles size={17} />
            Đăng ký tài khoản
          </button>
        </form>

        {/* Bottom Switch to Login */}
        <div
          style={{
            marginTop: 'auto',
            paddingTop: 8,
            textAlign: 'center',
            fontSize: 12.5,
            fontWeight: 600,
            color: 'var(--lq-ink-muted)'
          }}
        >
          Đã có tài khoản?{' '}
          <button
            type="button"
            onClick={onGoToLogin || onBack}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--lq-accent)',
              fontWeight: 800,
              fontSize: 12.5,
              cursor: 'pointer',
              padding: 0
            }}
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>
    )
  }

  // ==================== STEP 2: DAILY PACE SURVEY ====================
  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        padding: '16px 20px 24px',
        gap: 14
      }}
    >
      {/* Top Header & Progress */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <button
          onClick={() => setStep(1)}
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
          aria-label="Quay lại bước đăng ký"
        >
          <ArrowLeft size={18} />
        </button>

        {/* Progress Bar 2/2 */}
        <div
          style={{
            flex: 1,
            height: 8,
            borderRadius: 99,
            background: 'var(--lq-surface-subtle)',
            margin: '0 14px',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              height: '100%',
              width: '100%',
              borderRadius: 99,
              background: 'var(--lq-accent)',
              transition: 'width 0.3s ease'
            }}
          />
        </div>

        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--lq-ink-muted)' }}>
          2/2
        </span>
      </div>

      {/* Mascot Question Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 10,
          margin: '10px 0 4px'
        }}
      >
        <img
          src="/assets/fox/fox-mood-cheer-anim.webp"
          alt="Fox Cheer"
          style={{ width: 96, height: 'auto', objectFit: 'contain' }}
          onError={(e) => {
            ;(e.target as HTMLImageElement).src = '/assets/fox/fox-mood-cheer.png'
          }}
        />

        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 18,
            padding: '10px 14px',
            boxShadow: 'var(--shadow-sm)',
            fontWeight: 700,
            fontSize: 13,
            border: '1px solid var(--lq-border)',
            lineHeight: 1.4,
            flex: 1
          }}
        >
          Chào {fullName.trim() || 'bạn mới'}! Mỗi ngày bạn muốn dành bao lâu cho mục tiêu?
        </div>
      </div>

      <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--lq-ink)' }}>
        Chọn nhịp độ hành trình
      </div>

      {/* Options List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {durations.map((dur) => {
          const isSelected = selectedDuration === dur.label
          return (
            <div
              key={dur.label}
              onClick={() => setSelectedDuration(dur.label)}
              style={{
                borderRadius: 18,
                padding: '13px 16px',
                border: isSelected ? '2px solid var(--lq-accent)' : '1px solid var(--lq-border)',
                backgroundColor: isSelected ? 'var(--lq-accent-soft)' : '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div>
                <b style={{ fontSize: 14, color: 'var(--lq-ink)', display: 'block' }}>{dur.label}</b>
                <span style={{ fontSize: 11.5, color: 'var(--lq-ink-muted)', fontWeight: 600 }}>
                  {dur.desc}
                </span>
              </div>

              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  border: isSelected ? 'none' : '2px solid var(--lq-border)',
                  background: isSelected ? 'var(--lq-accent)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  flexShrink: 0
                }}
              >
                {isSelected && <Check size={14} strokeWidth={3} />}
              </div>
            </div>
          )
        })}
      </div>

      {/* Complete Button */}
      <div style={{ marginTop: 'auto', paddingTop: 14 }}>
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
          Bắt đầu hành trình
        </button>
      </div>
    </div>
  )
}

export default RegisterScreen
