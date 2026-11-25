import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { authApi } from '@/services/api/authApi'
import { useAuthStore } from '@/stores/authStore'
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
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [forgotNotice, setForgotNotice] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const redirectTarget = searchParams.get('redirect') || '/work'
  const safeRedirect = redirectTarget.startsWith('/') ? redirectTarget : '/'

  const validate = () => {
    const next: { email?: string; password?: string } = {}
    if (!email.trim()) {
      next.email = 'Vui lòng nhập email.'
    } else if (!EMAIL_RE.test(email.trim())) {
      next.email = 'Định dạng email không hợp lệ.'
    }
    if (!password) {
      next.password = 'Vui lòng nhập mật khẩu.'
    }
    setFieldErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    clearExpiredMessage()
    if (!validate()) return

    setSubmitting(true)
    try {
      const result = await authApi.login({ email: email.trim(), password })
      setSession({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user
      })
      navigate(safeRedirect, { replace: true })
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Đăng nhập thất bại.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleForgotPassword = async () => {
    try {
      await authApi.forgotPassword()
    } catch (err) {
      setForgotNotice(
        err instanceof Error
          ? err.message
          : 'Tính năng đặt lại mật khẩu chưa khả dụng trên Backend.'
      )
    }
  }

  return (
    <div className={styles.wrap}>
      <Card variant="elevated" className={styles.card}>
        <div className={styles.header}>
          <div className={styles.brandRow}>
            <div className={styles.brandMark} aria-hidden="true">
              LQ
            </div>
            <h1 className={styles.title}>Đăng nhập LifeQuest</h1>
          </div>
          <p className={styles.subtitle}>
            Kết nối trực tiếp tới Backend <code>POST /api/v1/auth/login</code>.
          </p>
        </div>

        {registeredMessage && (
          <div className={`${styles.alert} ${styles.alertSuccess}`} role="status">
            {registeredMessage}
          </div>
        )}

        {sessionExpiredMessage && (
          <div className={`${styles.alert} ${styles.alertInfo}`} role="alert">
            {sessionExpiredMessage}
          </div>
        )}

        {submitError && (
          <div className={`${styles.alert} ${styles.alertError}`} role="alert">
            {submitError}
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label htmlFor="login-email" className={styles.label}>
              Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'login-email-err' : undefined}
              placeholder="name@example.com"
            />
            {fieldErrors.email && (
              <span id="login-email-err" className={styles.fieldError} role="alert">
                {fieldErrors.email}
              </span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="login-password" className={styles.label}>
              Mật khẩu
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? 'login-password-err' : undefined}
              placeholder="Nhập mật khẩu"
            />
            {fieldErrors.password && (
              <span id="login-password-err" className={styles.fieldError} role="alert">
                {fieldErrors.password}
              </span>
            )}
          </div>

          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Button>
        </form>

        <div className={styles.footer}>
          <div>
            Chưa có tài khoản?{' '}
            <Link to="/register" className={styles.link}>
              Đăng ký ngay
            </Link>
          </div>
          <div>
            <button
              type="button"
              onClick={handleForgotPassword}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: 'var(--lq-ink-secondary)',
                textDecoration: 'underline',
                fontSize: 13
              }}
            >
              Quên mật khẩu?
            </button>
          </div>
          {forgotNotice && (
            <div className={`${styles.alert} ${styles.alertInfo}`} role="status">
              <strong>UNAVAILABLE:</strong> {forgotNotice}
            </div>
          )}
          <p className={styles.securityNote}>
            Bảo mật phiên: Access &amp; Refresh token chỉ được giữ trong bộ nhớ (RAM), không ghi vào
            localStorage/sessionStorage do Backend chưa hỗ trợ HttpOnly cookie.
          </p>
          <Link to="/" className={styles.link}>
            ← Quay lại Trang chủ
          </Link>
        </div>
      </Card>
    </div>
  )
}
