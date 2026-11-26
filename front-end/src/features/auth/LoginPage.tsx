import { useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Eye, EyeOff, Info, Loader2, WifiOff } from 'lucide-react'
import { authApi } from '@/services/api/authApi'
import { useAuthStore } from '@/stores/authStore'
import {
  isMockLoginCredential,
  MOCK_LOGIN_CREDENTIALS,
  useMockProfileStore,
} from '@/stores/mockProfileStore'
import { ApiClientError } from '@/types/api'
import { AuthLayout, type AuthFoxReaction } from './AuthLayout'
import { validateSafeRedirect } from './authRedirect'
import styles from './AuthPages.module.css'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const setSession = useAuthStore((s) => s.setSession)
  const sessionExpiredMessage = useAuthStore((s) => s.sessionExpiredMessage)
  const clearExpiredMessage = useAuthStore((s) => s.clearExpiredMessage)

  const registeredMessage = (location.state as { registeredMessage?: string } | null)
    ?.registeredMessage

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [submitError, setSubmitError] = useState<{ message: string; isNetwork?: boolean } | null>(
    null
  )
  const [submitting, setSubmitting] = useState(false)
  const [foxReaction, setFoxReaction] = useState<AuthFoxReaction>('LOGIN_IDLE')

  const submitLockRef = useRef(false)
  const emailInputRef = useRef<HTMLInputElement>(null)
  const passwordInputRef = useRef<HTMLInputElement>(null)

  const safeRedirect = validateSafeRedirect(searchParams.get('redirect'), '/work')

  const validate = () => {
    const next: { email?: string; password?: string } = {}
    const normalizedEmail = email.trim()
    if (!normalizedEmail) {
      next.email = 'Vui lòng nhập email.'
    } else if (!EMAIL_RE.test(normalizedEmail)) {
      next.email = 'Định dạng email không hợp lệ.'
    }
    if (!password) {
      next.password = 'Vui lòng nhập mật khẩu.'
    }
    setFieldErrors(next)

    if (next.email) {
      emailInputRef.current?.focus()
    } else if (next.password) {
      passwordInputRef.current?.focus()
    }
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (submitLockRef.current) return
    setSubmitError(null)
    clearExpiredMessage()
    if (!validate()) {
      setFoxReaction('LOGIN_ERROR')
      return
    }

    submitLockRef.current = true
    setSubmitting(true)
    setFoxReaction('LOGIN_LOADING')

    // Local QA Mock Account shortcut (only matches explicit demo credentials; never touches localStorage)
    if (isMockLoginCredential(email, password)) {
      const mockState = useMockProfileStore.getState()
      mockState.activateMockSession()
      setFoxReaction('LOGIN_SUCCESS')
      setSession({
        accessToken: 'mock-local-session-token',
        refreshToken: null,
        user: {
          id: MOCK_LOGIN_CREDENTIALS.userId,
          email: MOCK_LOGIN_CREDENTIALS.email,
          username: mockState.profile.username,
          status: 'ACTIVE',
        },
      })
      submitLockRef.current = false
      setSubmitting(false)
      navigate(searchParams.get('redirect') ? safeRedirect : '/profile', { replace: true })
      return
    }

    try {
      const result = await authApi.login({
        email: email.trim().toLowerCase(),
        password
      })
      setFoxReaction('LOGIN_SUCCESS')
      setSession({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user
      })
      navigate(safeRedirect, { replace: true })
    } catch (err) {
      setFoxReaction('LOGIN_ERROR')
      if (err instanceof ApiClientError) {
        if (err.isNetworkError || err.status === 0) {
          setSubmitError({
            message: 'Không thể kết nối máy chủ LifeQuest Backend. Vui lòng kiểm tra kết nối mạng.',
            isNetwork: true
          })
        } else if (err.status === 403) {
          setSubmitError({
            message: 'Tài khoản hiện không có quyền truy cập. Vui lòng liên hệ quản trị viên.'
          })
        } else {
          setSubmitError({
            message: err.message || 'Email hoặc mật khẩu không đúng.'
          })
        }
      } else {
        setSubmitError({
          message: err instanceof Error ? err.message : 'Đăng nhập thất bại.'
        })
      }
    } finally {
      submitLockRef.current = false
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      foxReaction={foxReaction}
      topActionLabel="ĐĂNG KÝ"
      topActionTo="/register"
    >
      <div className={styles.header}>
        <h1 className={styles.title}>Đăng nhập</h1>
      </div>

      {registeredMessage && (
        <div
          className={`${styles.alert} ${styles.alertSuccess}`}
          role="status"
          data-testid="login-registered-alert"
        >
          <CheckCircle2 size={16} className={styles.alertIcon} aria-hidden="true" />
          <span>{registeredMessage}</span>
        </div>
      )}

      {sessionExpiredMessage && (
        <div
          className={`${styles.alert} ${styles.alertInfo}`}
          role="alert"
          data-testid="login-expired-alert"
        >
          <Info size={16} className={styles.alertIcon} aria-hidden="true" />
          <span>{sessionExpiredMessage}</span>
        </div>
      )}

      {submitError && (
        <div
          className={`${styles.alert} ${styles.alertError}`}
          role="alert"
          data-testid={submitError.isNetwork ? 'login-network-error' : 'login-submit-error'}
        >
          {submitError.isNetwork ? (
            <WifiOff size={16} className={styles.alertIcon} aria-hidden="true" />
          ) : (
            <AlertCircle size={16} className={styles.alertIcon} aria-hidden="true" />
          )}
          <span>{submitError.message}</span>
        </div>
      )}

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label htmlFor="login-email" className={styles.srOnly}>
            Email
          </label>
          <div className={styles.inputWrap}>
            <input
              ref={emailInputRef}
              id="login-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              className={`${styles.input} ${fieldErrors.email ? styles.inputInvalid : ''}`.trim()}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }))
              }}
              onFocus={() => setFoxReaction('EMAIL_FOCUS')}
              onBlur={() => setFoxReaction((prev) => (prev === 'EMAIL_FOCUS' ? 'LOGIN_IDLE' : prev))}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'login-email-err' : undefined}
              placeholder="Email"
            />
          </div>
          {fieldErrors.email && (
            <span id="login-email-err" className={styles.fieldError} role="alert">
              <AlertCircle size={13} aria-hidden="true" />
              <span>{fieldErrors.email}</span>
            </span>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="login-password" className={styles.srOnly}>
            Mật khẩu
          </label>
          <div className={styles.inputWrap}>
            <input
              ref={passwordInputRef}
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className={`${styles.input} ${styles.inputWithInlineActions} ${fieldErrors.password ? styles.inputInvalid : ''}`.trim()}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: undefined }))
                }
              }}
              onFocus={() => setFoxReaction(showPassword ? 'PASSWORD_PEEK' : 'PASSWORD_FOCUS')}
              onBlur={() =>
                setFoxReaction((prev) =>
                  prev === 'PASSWORD_FOCUS' || prev === 'PASSWORD_PEEK' ? 'LOGIN_IDLE' : prev
                )
              }
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? 'login-password-err' : undefined}
              placeholder="Mật khẩu"
            />
            <div className={styles.inputTrailingGroup}>
              <Link
                to="/forgot-password"
                className={styles.inlineForgotLink}
                data-testid="login-forgot-link"
              >
                QUÊN?
              </Link>
              <button
                type="button"
                className={styles.passwordToggleBtn}
                onClick={() => {
                  setShowPassword((v) => {
                    const next = !v
                    setFoxReaction((prev) =>
                      prev === 'PASSWORD_FOCUS' || prev === 'PASSWORD_PEEK'
                        ? next
                          ? 'PASSWORD_PEEK'
                          : 'PASSWORD_FOCUS'
                        : prev
                    )
                    return next
                  })
                }}
                aria-label={showPassword ? 'Ẩn ký tự bí mật' : 'Hiện ký tự bí mật'}
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                aria-pressed={showPassword}
                data-testid="login-toggle-password"
              >
                {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
              </button>
            </div>
          </div>
          {fieldErrors.password && (
            <span id="login-password-err" className={styles.fieldError} role="alert">
              <AlertCircle size={13} aria-hidden="true" />
              <span>{fieldErrors.password}</span>
            </span>
          )}
        </div>

        <button
          type="submit"
          className={styles.primaryCtaBtn}
          disabled={submitting}
          data-testid="login-submit-btn"
        >
          {submitting && <Loader2 size={17} className={styles.spinIcon} aria-hidden="true" />}
          <span>{submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}</span>
        </button>
      </form>

      <div
        style={{
          marginTop: 14,
          padding: '12px 14px',
          borderRadius: 14,
          background: '#FFF8F1',
          border: '1.5px dashed #EBCBA9',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
        data-testid="mock-login-box"
      >
        <div style={{ fontSize: 12, fontWeight: 800, color: '#9A4A1C' }}>
          Tài khoản Mock kiểm thử Hồ sơ (Local QA)
        </div>
        <div style={{ fontSize: 12, color: '#5F6E7D', lineHeight: 1.45 }}>
          Email: <code>{MOCK_LOGIN_CREDENTIALS.email}</code> · Mật khẩu:{' '}
          <code>{MOCK_LOGIN_CREDENTIALS.password}</code>
        </div>
        <button
          type="button"
          data-testid="mock-login-btn"
          onClick={() => {
            const mockState = useMockProfileStore.getState()
            mockState.activateMockSession()
            setFoxReaction('LOGIN_SUCCESS')
            setSession({
              accessToken: 'mock-local-session-token',
              refreshToken: null,
              user: {
                id: MOCK_LOGIN_CREDENTIALS.userId,
                email: MOCK_LOGIN_CREDENTIALS.email,
                username: mockState.profile.username,
                status: 'ACTIVE',
              },
            })
            navigate(searchParams.get('redirect') ? safeRedirect : '/profile', { replace: true })
          }}
          style={{
            border: '1.5px solid #F26B3A',
            background: '#FFFFFF',
            color: '#B84317',
            borderRadius: 11,
            padding: '8px 12px',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Dùng nhanh tài khoản Mock → Hồ sơ
        </button>
      </div>

      <footer className={styles.legalFooter}>
        <p className={styles.legalText}>
          Phiên đăng nhập LifeQuest chỉ được lưu tạm trong bộ nhớ trình duyệt (RAM), không ghi token
          vào localStorage.
        </p>
      </footer>
    </AuthLayout>
  )
}
