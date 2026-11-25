import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, Clock, Lock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { authApi } from '@/services/api/authApi'
import { AuthLayout } from './AuthLayout'
import styles from './AuthPages.module.css'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [pendingNotice, setPendingNotice] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFieldError(null)
    setPendingNotice(null)

    const trimmed = email.trim()
    if (!trimmed) {
      setFieldError('Vui lòng nhập địa chỉ email.')
      return
    }
    if (!EMAIL_RE.test(trimmed)) {
      setFieldError('Định dạng email không hợp lệ.')
      return
    }

    // Honest Backend boundary: authService.forgotPassword is a TODO stub (no email pipeline yet).
    // Never display a false "email sent" success message.
    try {
      await authApi.forgotPassword()
    } catch (err) {
      setPendingNotice(
        err instanceof Error
          ? err.message
          : 'Chức năng đặt lại mật khẩu qua email đang chờ hoàn thiện trên Backend.'
      )
    }
  }

  return (
    <AuthLayout
      foxReaction="RECOVERY_PENDING"
      topActionLabel="ĐĂNG NHẬP"
      topActionTo="/login"
    >
      <div className={styles.header}>
        <span className={styles.pendingChip} data-testid="forgot-pending-badge">
          <Clock size={12} aria-hidden="true" />
          <span>PENDING BACKEND</span>
        </span>
        <h1 className={styles.title}>Quên mật khẩu</h1>
        <p className={styles.subtitle}>
          Nhập email đã đăng ký để nhận hướng dẫn đặt lại mật khẩu khi Backend kích hoạt dịch vụ email.
        </p>
      </div>

      <div
        className={`${styles.alert} ${styles.alertInfo}`}
        role="status"
        data-testid="forgot-pending-banner"
      >
        <Lock size={16} className={styles.alertIcon} aria-hidden="true" />
        <span>
          <strong>Chờ tích hợp Backend:</strong> Endpoint <code>POST /api/v1/auth/forgot-password</code>{' '}
          hiện chưa có dịch vụ gửi email xác thực nên hệ thống sẽ không gửi liên kết giả lập.
        </span>
      </div>

      {pendingNotice && (
        <div
          className={`${styles.alert} ${styles.alertError}`}
          role="alert"
          data-testid="forgot-submit-notice"
        >
          <AlertCircle size={16} className={styles.alertIcon} aria-hidden="true" />
          <span>{pendingNotice}</span>
        </div>
      )}

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label htmlFor="forgot-email" className={styles.label}>
            Email tài khoản
          </label>
          <input
            id="forgot-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            className={`${styles.input} ${fieldError ? styles.inputInvalid : ''}`.trim()}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (fieldError) setFieldError(null)
            }}
            aria-invalid={Boolean(fieldError)}
            aria-describedby={fieldError ? 'forgot-email-err' : undefined}
            placeholder="name@example.com"
          />
          {fieldError && (
            <span id="forgot-email-err" className={styles.fieldError} role="alert">
              <AlertCircle size={13} aria-hidden="true" />
              <span>{fieldError}</span>
            </span>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          className={styles.submitBtn}
          data-testid="forgot-submit-btn"
        >
          Kiểm tra trạng thái khôi phục (Chờ Backend)
        </Button>
      </form>

      <div className={styles.footer}>
        <div>
          Đã nhớ mật khẩu?{' '}
          <Link to="/login" className={styles.link}>
            Quay lại Đăng nhập
          </Link>
        </div>
        <div>
          Xem trước màn hình nhập mật khẩu mới:{' '}
          <Link to="/reset-password" className={styles.subLink}>
            /reset-password
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}
