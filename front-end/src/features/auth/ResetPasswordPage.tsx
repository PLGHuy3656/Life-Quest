import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertCircle, Clock, Eye, EyeOff, Lock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { authApi } from '@/services/api/authApi'
import { AuthLayout } from './AuthLayout'
import styles from './AuthPages.module.css'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const tokenParam = searchParams.get('token')?.trim() ?? ''

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string }>({})
  const [pendingNotice, setPendingNotice] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setPendingNotice(null)
    const next: { password?: string; confirm?: string } = {}
    if (newPassword.length < 8 || newPassword.length > 72) {
      next.password = 'Mật khẩu mới phải từ 8 đến 72 ký tự.'
    }
    if (confirmPassword !== newPassword) {
      next.confirm = 'Mật khẩu xác nhận không khớp.'
    }
    setFieldErrors(next)
    if (Object.keys(next).length > 0) return

    // Honest Backend boundary: never fake reset token verification
    try {
      await authApi.resetPassword()
    } catch (err) {
      setPendingNotice(
        err instanceof Error
          ? err.message
          : 'Chức năng xác nhận đặt lại mật khẩu chưa được kích hoạt trên Backend.'
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
        <span className={styles.pendingChip} data-testid="reset-pending-badge">
          <Clock size={12} aria-hidden="true" />
          <span>PENDING BACKEND</span>
        </span>
        <h1 className={styles.title}>Đặt lại mật khẩu</h1>
        <p className={styles.subtitle}>
          {tokenParam
            ? 'Đã nhận mã xác thực từ liên kết, nhưng Backend chưa kích hoạt kiểm tra token.'
            : 'Chưa có token đặt lại mật khẩu hợp lệ (chế độ xem trước giao diện).'}
        </p>
      </div>

      <div
        className={`${styles.alert} ${styles.alertInfo}`}
        role="status"
        data-testid="reset-pending-banner"
      >
        <Lock size={16} className={styles.alertIcon} aria-hidden="true" />
        <span>
          <strong>Chờ tích hợp Backend:</strong> Endpoint <code>POST /api/v1/auth/reset-password</code>{' '}
          đang là placeholder trên Backend; Frontend không tạo token giả hoặc xác nhận thành công giả.
        </span>
      </div>

      {pendingNotice && (
        <div
          className={`${styles.alert} ${styles.alertError}`}
          role="alert"
          data-testid="reset-submit-notice"
        >
          <AlertCircle size={16} className={styles.alertIcon} aria-hidden="true" />
          <span>{pendingNotice}</span>
        </div>
      )}

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label htmlFor="reset-password" className={styles.label}>
            Mật khẩu mới (8–72 ký tự)
          </label>
          <div className={styles.inputWrap}>
            <input
              id="reset-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className={`${styles.input} ${styles.inputWithToggle} ${fieldErrors.password ? styles.inputInvalid : ''}`.trim()}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              aria-invalid={Boolean(fieldErrors.password)}
              placeholder="Tối thiểu 8 ký tự"
            />
            <button
              type="button"
              className={styles.passwordToggleBtn}
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ẩn ký tự bí mật' : 'Hiện ký tự bí mật'}
              title={showPassword ? 'Ẩn mật khẩu mới' : 'Hiện mật khẩu mới'}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
            </button>
          </div>
          {fieldErrors.password && (
            <span className={styles.fieldError} role="alert">
              <AlertCircle size={13} aria-hidden="true" />
              <span>{fieldErrors.password}</span>
            </span>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="reset-confirm" className={styles.label}>
            Xác nhận mật khẩu mới
          </label>
          <input
            id="reset-confirm"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            className={`${styles.input} ${fieldErrors.confirm ? styles.inputInvalid : ''}`.trim()}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            aria-invalid={Boolean(fieldErrors.confirm)}
            placeholder="Nhập lại mật khẩu mới"
          />
          {fieldErrors.confirm && (
            <span className={styles.fieldError} role="alert">
              <AlertCircle size={13} aria-hidden="true" />
              <span>{fieldErrors.confirm}</span>
            </span>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          className={styles.submitBtn}
          data-testid="reset-submit-btn"
        >
          Cập nhật mật khẩu (Chờ Backend)
        </Button>
      </form>

      <div className={styles.footer}>
        <Link to="/login" className={styles.link}>
          ← Quay lại Đăng nhập
        </Link>
      </div>
    </AuthLayout>
  )
}
