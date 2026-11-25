import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { authApi } from '@/services/api/authApi'
import styles from './AuthPages.module.css'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface RegisterErrors {
  email?: string
  username?: string
  password?: string
  confirmPassword?: string
}

export function RegisterPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<RegisterErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const validate = () => {
    const next: RegisterErrors = {}
    if (!email.trim()) {
      next.email = 'Vui lòng nhập email.'
    } else if (!EMAIL_RE.test(email.trim())) {
      next.email = 'Định dạng email không hợp lệ.'
    }

    const trimmedUser = username.trim()
    if (trimmedUser.length < 3 || trimmedUser.length > 50) {
      next.username = 'Tên đăng nhập phải từ 3 đến 50 ký tự.'
    }

    if (password.length < 8 || password.length > 72) {
      next.password = 'Mật khẩu phải từ 8 đến 72 ký tự.'
    }

    if (confirmPassword !== password) {
      next.confirmPassword = 'Mật khẩu xác nhận không khớp.'
    }

    setFieldErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    if (!validate()) return

    setSubmitting(true)
    try {
      await authApi.register({
        email: email.trim(),
        username: username.trim(),
        password
      })
      navigate('/login', {
        replace: true,
        state: {
          registeredMessage: 'Đăng ký tài khoản thành công! Vui lòng đăng nhập.'
        }
      })
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Đăng ký thất bại.')
    } finally {
      setSubmitting(false)
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
            <h1 className={styles.title}>Tạo tài khoản LifeQuest</h1>
          </div>
          <p className={styles.subtitle}>
            Đăng ký trực tiếp qua <code>POST /api/v1/auth/register</code>.
          </p>
        </div>

        {submitError && (
          <div className={`${styles.alert} ${styles.alertError}`} role="alert">
            {submitError}
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label htmlFor="reg-email" className={styles.label}>
              Email
            </label>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(fieldErrors.email)}
            />
            {fieldErrors.email && (
              <span className={styles.fieldError} role="alert">
                {fieldErrors.email}
              </span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="reg-username" className={styles.label}>
              Tên đăng nhập (3–50 ký tự)
            </label>
            <input
              id="reg-username"
              type="text"
              autoComplete="username"
              className={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              aria-invalid={Boolean(fieldErrors.username)}
            />
            {fieldErrors.username && (
              <span className={styles.fieldError} role="alert">
                {fieldErrors.username}
              </span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="reg-password" className={styles.label}>
              Mật khẩu (8–72 ký tự)
            </label>
            <input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={Boolean(fieldErrors.password)}
            />
            {fieldErrors.password && (
              <span className={styles.fieldError} role="alert">
                {fieldErrors.password}
              </span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="reg-confirm" className={styles.label}>
              Xác nhận mật khẩu
            </label>
            <input
              id="reg-confirm"
              type="password"
              autoComplete="new-password"
              className={styles.input}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
            />
            {fieldErrors.confirmPassword && (
              <span className={styles.fieldError} role="alert">
                {fieldErrors.confirmPassword}
              </span>
            )}
          </div>

          <Button type="submit" variant="accent" disabled={submitting}>
            {submitting ? 'Đang tạo tài khoản...' : 'Đăng ký'}
          </Button>
        </form>

        <div className={styles.footer}>
          <div>
            Đã có tài khoản?{' '}
            <Link to="/login" className={styles.link}>
              Đăng nhập
            </Link>
          </div>
          <Link to="/" className={styles.link}>
            ← Quay lại Trang chủ
          </Link>
        </div>
      </Card>
    </div>
  )
}
